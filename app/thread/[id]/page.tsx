"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Send, Trash2, Paperclip, FileText } from "lucide-react";
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
        if (id) {
            loadData();
            const timer = setInterval(loadData, 5000);
            return () => clearInterval(timer);
        }
    }, [id]);

    const deleteThread = async () => {
        if (!confirm("本当にこのスレッドを削除しますか？")) return;
        await fetch(`/api/threads/${id}`, { method: "DELETE" });
        router.push("/");
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
                body: JSON.stringify({ name, content, ...attachmentData }),
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
        <div className="max-w-3xl mx-auto p-4 pb-32 min-h-screen bg-[#f0fdf4]">
            {/* Header */}
            <div className="sticky top-0 bg-[#f0fdf4]/90 backdrop-blur-md z-10 py-4 mb-6 flex justify-between items-center border-b border-[#4ade80]/20">
                <div className="flex items-center gap-4 overflow-hidden">
                    <Link href="/">
                        <button className="p-3 bg-white rounded-full shadow-sm hover:shadow-md transition-all flex-shrink-0 text-[#4ade80]">
                            <ArrowLeft size={24} />
                        </button>
                    </Link>
                    <h1 className="text-xl lg:text-2xl font-black truncate text-slate-700 tracking-tight">{data.thread.title}</h1>
                </div>
                <button
                    onClick={deleteThread}
                    className="p-3 bg-white text-rose-400 hover:bg-rose-50 rounded-full shadow-sm transition-colors flex-shrink-0"
                    title="Delete Thread"
                >
                    <Trash2 size={24} />
                </button>
            </div>

            {/* Posts */}
            <div className="space-y-6">
                {data.posts.map((post: any, i: number) => (
                    <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex gap-4"
                    >
                        <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-md flex-shrink-0 text-lg
                ${i % 2 === 0 ? "bg-[#f472b6]" : "bg-[#facc15]"}`}
                        >
                            {(post.name || "N").charAt(0)}
                        </div>

                        <div className="flex-1">
                            <div className="flex items-baseline gap-3 mb-1 pl-1">
                                <span className="font-bold text-slate-600">{post.name}</span>
                                <span className="text-xs text-slate-400 font-mono">{new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="bg-white p-5 rounded-r-3xl rounded-bl-3xl shadow-sm border border-slate-100 text-slate-700 whitespace-pre-wrap relative group hover:shadow-md transition-shadow">
                                <p className="text-slate-700 leading-relaxed text-lg">{post.content}</p>

                                {post.attachment_url && (
                                    <div className="mt-3">
                                        {post.attachment_type?.startsWith("image/") ? (
                                            <a href={post.attachment_url} target="_blank" rel="noopener noreferrer">
                                                <img
                                                    src={post.attachment_url}
                                                    alt="attached"
                                                    className="max-w-sm max-h-80 rounded-2xl border-2 border-[#f0fdf4] hover:opacity-90 transition-opacity object-cover cursor-zoom-in shadow-sm"
                                                />
                                            </a>
                                        ) : (
                                            <a
                                                href={post.attachment_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-[#4ade80] hover:text-green-600 bg-[#f0fdf4] px-4 py-3 rounded-xl transition-colors font-medium border border-[#4ade80]/30"
                                            >
                                                <FileText size={20} />
                                                <span className="truncate max-w-[200px]">{post.attachment_name || "Attachment"}</span>
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Footer Form */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-lg border-t border-slate-100 shadow-2xl">
                <form onSubmit={postComment} className="max-w-3xl mx-auto flex flex-col gap-3">
                    <div className="flex gap-3">
                        <input
                            className="w-1/3 p-3 bg-slate-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4ade80] font-medium"
                            placeholder="Name (Optional)"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <div className="flex items-center gap-2 flex-1 justify-end">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                id="file-upload"
                            />
                            <label
                                htmlFor="file-upload"
                                className={`cursor-pointer inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full transition-all font-bold shadow-sm ${file ? "bg-[#f472b6] text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                    }`}
                            >
                                <Paperclip size={18} />
                                {file ? <span className="max-w-[100px] truncate">{file.name}</span> : "File"}
                            </label>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <textarea
                            className="flex-1 p-4 bg-slate-50 rounded-3xl focus:outline-none focus:ring-2 focus:ring-[#4ade80] resize-none h-16 text-lg"
                            placeholder="Write a happy comment..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                        <button
                            type="submit"
                            disabled={isUploading || (!content && !file)}
                            className="bg-[#4ade80] text-white w-16 h-16 rounded-3xl hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center shadow-lg hover:shadow-xl"
                        >
                            {isUploading ? <div className="animate-spin w-6 h-6 border-2 border-white rounded-full border-t-transparent" /> : <Send size={28} className="-ml-1" />}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
