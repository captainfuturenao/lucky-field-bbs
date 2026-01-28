"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MessageCircle, Plus } from "lucide-react";

export default function Home() {
  const [threads, setThreads] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
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
        body: JSON.stringify({ title: newTitle }),
      });
      if (res.ok) {
        setNewTitle("");
        setIsOpen(false);
        const listRes = await fetch("/api/threads");
        const listData = await listRes.json();
        if (Array.isArray(listData)) setThreads(listData);
      }
    } catch (e) {
      alert("Error creating thread");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 min-h-screen">
      <header className="flex flex-col items-center mb-12 mt-8">
        <motion.img
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          src="/mascot.png"
          alt="Lucky Field Mascot"
          className="w-64 h-64 lg:w-80 lg:h-80 object-contain drop-shadow-xl hover:scale-105 transition-transform"
        />
        <h1 className="text-4xl lg:text-5xl font-black text-[#4ade80] tracking-tighter drop-shadow-sm mt-4 text-center">
          Lucky Field 掲示板🍀
        </h1>
        <p className="text-slate-500 font-bold mt-2">Happy & Lucky Community</p>
      </header>

      <div className="flex justify-center mb-8">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-[#facc15] hover:bg-yellow-400 text-yellow-900 px-8 py-4 rounded-full font-bold shadow-lg flex items-center gap-2 transition-all active:scale-95 text-lg"
        >
          <Plus size={24} /> 新しい話題を作る！
        </button>
      </div>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl shadow-xl mb-12 border-4 border-[#4ade80] max-w-2xl mx-auto"
        >
          <h2 className="font-bold text-[#4ade80] text-xl mb-4 text-center">What makes you happy today?</h2>
          <input
            type="text"
            placeholder="スレッドのタイトルを入れてね"
            className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 focus:outline-none focus:border-[#4ade80] mb-6 text-lg"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <button
            onClick={createThread}
            className="w-full bg-[#f472b6] text-white font-bold py-4 rounded-2xl hover:bg-pink-500 transition-colors shadow-md text-lg"
          >
            作成する！
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {threads.map((thread) => (
          <Link href={`/thread/${thread.id}`} key={thread.id}>
            <motion.div
              whileHover={{ scale: 1.03, rotate: -1 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white p-6 rounded-3xl shadow-md border-2 border-white hover:border-[#f472b6] cursor-pointer transition-colors h-full flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="bg-[#f0fdf4] text-[#4ade80] text-xs px-3 py-1 rounded-full font-bold inline-block border border-[#4ade80]">
                    {thread.category}
                  </span>
                  <div className="flex items-center gap-1 text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
                    <MessageCircle size={16} />
                    <span className="font-bold text-sm">{thread.count}</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-700 leading-snug">{thread.title}</h3>
              </div>
              <div className="mt-4 text-right text-xs text-slate-400 font-medium">
                {new Date(thread.created_at).toLocaleDateString()}
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
