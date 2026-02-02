"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Send, Trash2, Paperclip, FileText, Pencil, X } from "lucide-react";
import { PutBlobResult } from "@vercel/blob";

export default function ThreadDetail() {
    const params = useParams();
    const id = params?.id as string;
    const router = useRouter();

    const [data, setData] = useState<{ thread: any; posts: any[] } | null>(null);
    const [content, setContent] = useState("");
    const [name, setName] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [authorId, setAuthorId] = useState("");
    const [editingPostId, setEditingPostId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadData = async () => {
        if (!id) return;
        try {
            const res = await fetch(`/api/threads/${id}`);
            if (!res.ok) throw new Error("Failed to fetch");
            const json = await res.json();
            setData(json);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        // Author IDの取得
        const storedId = localStorage.getItem("lucky_author_id") || "";
        setAuthorId(storedId);

        if (id) {
            loadData();
            const timer = setInterval(loadData, 10000);
            return () => clearInterval(timer);
        }
    }, [id]);

    const deleteThread = async () => {
        const adminKey = prompt("管理者パスワードを入力してください (Thread deletion is for admins only)");
        if (!adminKey) return;

        const res = await fetch(`/api/threads/${id}?admin_key=${adminKey}`, { method: "DELETE" });
        if (res.ok) {
            router.push("/");
        } else {
            const err = await res.json();
            alert(err.error || "削除に失敗しました");
        }
    };

    const deletePost = async (postId: number) => {
        if (!confirm("この投稿を削除しますか？")) return;
        const res = await fetch(`/api/posts/${postId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ author_id: authorId })
        });
        if (res.ok) {
            loadData();
        } else {
            alert("削除に失敗しました。自分の投稿のみ削除可能です。");
        }
    };

    const startEditing = (post: any) => {
        setEditingPostId(post.id);
        setEditContent(post.content);
    };

    const saveEdit = async (postId: number) => {
        const res = await fetch(`/api/posts/${postId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: editContent, author_id: authorId })
        });
        if (res.ok) {
            setEditingPostId(null);
            loadData();
        } else {
            alert("更新に失敗しました");
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const postComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content && !file) return;

        setIsUploading(true);
        let attachmentData = {};

        try {
            if (file) {
                const response = await fetch(`/api/upload?filename=${file.name}`, {
                    method: "POST",
                    body: file,
                });
                const newBlob = (await response.json()) as PutBlobResult;
                attachmentData = {
                    attachment_url: newBlob.url,
                    attachment_name: file.name,
                    attachment_type: file.type,
                };
            }

            await fetch(`/api/threads/${id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name, content, author_id: authorId, ...attachmentData }),
            });

            setContent("");
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            loadData();
        } catch (err) {
            console.error(err);
            alert("投稿に失敗しました");
        } finally {
            setIsUploading(false);
        }
    };

    if (!data) return <div className="text-center p-20 text-[#4ade80] font-bold text-xl">Loading Lucky Data...</div>;

    return (
        <div className="max-w-4xl mx-auto p-4 pb-48 min-h-screen bg-slate-50 font-sans">
            {/* Header */}
            <div className="sticky top-0 bg-white/80 backdrop-blur-xl z-20 py-6 mb-12 flex justify-between items-center border-b border-slate-200 px-4 rounded-b-[2rem] shadow-sm">
                <div className="flex items-center gap-6 overflow-hidden">
                    <Link href="/">
                        <button className="p-3 bg-slate-100 hover:bg-[#4ade80] hover:text-white rounded-full transition-all flex-shrink-0 text-slate-600">
                            <ArrowLeft size={24} />
                        </button>
                    </Link>
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-black tracking-widest text-[#4ade80] mb-0.5">{data.thread.category}</span>
                        <h1 className="text-2xl lg:text-3xl font-black truncate text-slate-800 tracking-tight">{data.thread.title}</h1>
                    </div>
                </div>
                <button
                    onClick={deleteThread}
                    className="p-3 bg-slate-100 text-slate-400 hover:bg-rose-500 hover:text-white rounded-full transition-all flex-shrink-0 shadow-sm"
                    title="Delete Thread (Admin Only)"
                >
                    <Trash2 size={24} />
                </button>
            </div>

            {/* Posts */}
            <div className="space-y-8 px-2">
                {data.posts.map((post: any, i: number) => (
                    <motion.div
                        key={post.id}
                        initial={{ opacity: 0, x: i % 2 === 0 ? -10 : 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex gap-4 group"
                    >
                        <div
                            className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white shadow-lg flex-shrink-0 text-xl
                ${post.author_id === authorId ? "bg-slate-900" : (i % 2 === 0 ? "bg-[#4ade80]" : "bg-[#facc15]")}`}
                        >
                            {(post.name || "N").charAt(0)}
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-2 px-1">
                                <div className="flex items-center gap-3">
                                    <span className="font-black text-slate-700">{post.name}</span>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase">{new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    {post.author_id === authorId && (
                                        <span className="text-[9px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full font-black uppercase">You</span>
                                    )}
                                </div>
                                {post.author_id === authorId && editingPostId !== post.id && (
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => startEditing(post)} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors">
                                            <Pencil size={14} />
                                        </button>
                                        <button onClick={() => deletePost(post.id)} className="p-1.5 hover:bg-rose-100 hover:text-rose-500 rounded-lg text-slate-400 transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className={`bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-100 text-slate-700 relative hover:shadow-md transition-shadow
                                ${post.author_id === authorId ? "border-slate-300 ring-2 ring-slate-100" : ""}`}>

                                {editingPostId === post.id ? (
                                    <div className="space-y-4">
                                        <textarea
                                            className="w-full p-4 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4ade80] resize-none h-24"
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setEditingPostId(null)} className="px-4 py-2 text-sm font-bold text-slate-400 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1">
                                                <X size={16} /> キャンセル
                                            </button>
                                            <button onClick={() => saveEdit(post.id)} className="px-4 py-2 text-sm font-bold bg-[#4ade80] text-white rounded-xl hover:bg-green-500 transition-colors shadow-sm">
                                                保存する
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-slate-800 leading-relaxed text-lg whitespace-pre-wrap">{post.content}</p>

                                        {post.attachment_url && (
                                            <div className="mt-4">
                                                {post.attachment_type?.startsWith("image/") ? (
                                                    <a href={post.attachment_url} target="_blank" rel="noopener noreferrer" className="inline-block">
                                                        <img
                                                            src={post.attachment_url}
                                                            alt="attached"
                                                            className="max-w-full md:max-w-md max-h-96 rounded-2xl border-4 border-slate-50 hover:opacity-95 transition-all object-cover cursor-zoom-in shadow-md"
                                                        />
                                                    </a>
                                                ) : (
                                                    <a
                                                        href={post.attachment_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-3 text-slate-700 hover:text-[#4ade80] bg-slate-50 hover:bg-white px-5 py-4 rounded-2xl transition-all font-bold border border-slate-100 hover:border-[#4ade80]/30 shadow-sm"
                                                    >
                                                        <FileText size={20} className="text-[#4ade80]" />
                                                        <span className="truncate max-w-[200px]">{post.attachment_name || "Attachment"}</span>
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Floating Reply Form */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[95%] max-w-3xl z-30">
                <div className="bg-white/90 backdrop-blur-2xl p-4 rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-white/50">
                    <form onSubmit={postComment} className="flex flex-col gap-3">
                        <div className="flex items-center gap-3 px-2">
                            <input
                                className="w-40 p-3 bg-slate-100/50 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-[#4ade80] font-bold"
                                placeholder="名前 (任意)"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                            <div className="flex-1 flex justify-end">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label
                                    htmlFor="file-upload"
                                    className={`cursor-pointer inline-flex items-center gap-2 text-xs px-4 py-2.5 rounded-full transition-all font-black shadow-sm ${file ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                        }`}
                                >
                                    <Paperclip size={16} />
                                    {file ? <span className="max-w-[100px] truncate">{file.name}</span> : "ファイルを添付"}
                                </label>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <textarea
                                className="flex-1 p-4 bg-slate-100/50 rounded-3xl focus:outline-none focus:ring-2 focus:ring-[#4ade80] resize-none h-16 text-base font-medium"
                                placeholder="ハッピーなコメントを書こう..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />
                            <button
                                type="submit"
                                disabled={isUploading || (!content && !file)}
                                className="bg-[#4ade80] text-white w-16 h-16 rounded-[2rem] hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center shadow-lg hover:shadow-[#4ade80]/20"
                            >
                                {isUploading ? <div className="animate-spin w-6 h-6 border-2 border-white rounded-full border-t-transparent" /> : <Send size={24} />}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
