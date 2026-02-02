"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MessageCircle, Plus, Tag } from "lucide-react";
import { BackgroundPaths } from "@/components/ui/background-paths";

const CATEGORIES = ["雑談", "相談", "質問", "報告", "ニュース"];

export default function Home() {
  const [threads, setThreads] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("雑談");
  const [isOpen, setIsOpen] = useState(false);
  const [authorId, setAuthorId] = useState("");

  useEffect(() => {
    // Author IDの取得または生成
    let id = localStorage.getItem("lucky_author_id");
    if (!id) {
      id = "user_" + Math.random().toString(36).substring(2, 11);
      localStorage.setItem("lucky_author_id", id);
    }
    setAuthorId(id);

    fetch("/api/threads")
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setThreads(data);
        else setThreads([]);
      })
      .catch((e) => console.error(e));
  }, []);

  const createThread = async () => {
    if (!newTitle) return;
    try {
      const res = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          category: newCategory,
          author_id: authorId
        }),
      });
      if (res.ok) {
        setNewTitle("");
        setIsOpen(false);
        const listRes = await fetch("/api/threads");
        const listData = await listRes.json();
        if (Array.isArray(listData)) setThreads(listData);
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.error || "Failed to create thread"}`);
      }
    } catch (e) {
      alert("Error creating thread: Network error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="relative h-[500px] w-full overflow-hidden">
        <BackgroundPaths title="Lucky Field BBS" />
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20">
          <p className="text-slate-500 font-bold bg-white/50 backdrop-blur-sm px-4 py-1 rounded-full text-center">
            Happy & Lucky Community🍀
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto p-4 py-12">
        <div className="flex justify-center mb-12">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="bg-[#4ade80] hover:bg-green-500 text-white px-10 py-5 rounded-full font-bold shadow-xl flex items-center gap-2 transition-all active:scale-95 text-xl group"
          >
            <Plus size={24} className="group-hover:rotate-90 transition-transform" />
            新しい話題を投稿する
          </button>
        </div>

        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 rounded-[2rem] shadow-2xl mb-16 border-4 border-[#4ade80]/20 max-w-2xl mx-auto"
          >
            <h2 className="font-black text-slate-800 text-2xl mb-6 text-center italic">What's on your mind?</h2>

            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-500 mb-2 ml-2">カテゴリー</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setNewCategory(cat)}
                    className={`px-4 py-2 rounded-xl font-bold transition-all ${newCategory === cat
                        ? "bg-[#4ade80] text-white shadow-md scale-105"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-bold text-slate-500 mb-2 ml-2">タイトル</label>
              <input
                type="text"
                placeholder="興味を引くタイトルを入力してね"
                className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-[#4ade80] focus:bg-white transition-all outline-none text-lg shadow-inner"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>

            <button
              onClick={createThread}
              className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-slate-800 transition-all shadow-lg text-lg active:scale-[0.98]"
            >
              スレッドを作成する
            </button>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {threads.map((thread) => (
            <Link href={`/thread/${thread.id}`} key={thread.id}>
              <motion.div
                whileHover={{ y: -5, shadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
                className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 cursor-pointer transition-all h-full flex flex-col justify-between group"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-slate-900 text-white text-[10px] uppercase tracking-widest px-3 py-1 rounded-full font-black">
                      {thread.category}
                    </span>
                    <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-[#4ade80] transition-colors">
                      <MessageCircle size={18} />
                      <span className="font-black text-sm">{thread.count}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 leading-tight group-hover:text-[#4ade80] transition-colors">{thread.title}</h3>
                </div>
                <div className="mt-8 flex justify-between items-center pt-4 border-t border-slate-50">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                    {new Date(thread.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-[#4ade80]/10 group-hover:text-[#4ade80] transition-all">
                    →
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
