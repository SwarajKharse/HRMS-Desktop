import React, { useState, useEffect } from "react";

const NEW_URL = "https://app.safetysaarthi.in";
const APK_URL = "https://drive.google.com/uc?export=download&id=18CK0Eq63VST_h1mzggktII6rP1KYk-Vi";
const SECONDS = 15;

export default function MigrationNotice() {
  const [count, setCount] = useState(SECONDS);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    if (count <= 0) {
      window.location.replace(NEW_URL);
      return;
    }
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count, paused]);

  const pct = ((SECONDS - count) / SECONDS) * 100;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 px-4 py-10">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="h-1.5 bg-slate-200">
          <div
            className="h-full bg-blue-600 transition-all duration-1000 ease-linear"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="p-8 sm:p-10 text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
            <svg
              className="h-7 w-7 text-blue-600"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            We have moved
          </h1>
          <p className="mt-3 text-slate-600 leading-relaxed">
            Safety Saarthi HRMS now runs on a new address. Please update your
            bookmarks and use the new link from now on.
          </p>

          <div className="mt-6 rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm">
            <div className="text-slate-400 line-through">
              hrms.safetysaarthi.in
            </div>
            <div className="mt-1 font-semibold text-blue-700 text-base">
              app.safetysaarthi.in
            </div>
          </div>

          <a
            href={NEW_URL}
            className="mt-6 block w-full rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition"
          >
            Continue to the new site
          </a>

          <a
            href={APK_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 px-6 py-3 font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16"
              />
            </svg>
            Download the Android app
          </a>

          <div className="mt-6 text-sm text-slate-500">
            {paused ? (
              <span>Automatic redirect paused.</span>
            ) : (
              <span>
                Redirecting in{" "}
                <span className="font-semibold text-slate-900">{count}</span>{" "}
                seconds.{" "}
                <button
                  onClick={() => setPaused(true)}
                  className="underline hover:text-slate-700"
                >
                  Stay here
                </button>
              </span>
            )}
          </div>

          <p className="mt-6 text-xs text-slate-400">
            Safety Saarthi Private Limited
          </p>
        </div>
      </div>
    </div>
  );
}
