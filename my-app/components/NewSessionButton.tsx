"use client";

import { useRouter } from "next/navigation";

export default function NewSessionButton() {
  const router = useRouter();

  const startNew = () => {
    try {
      window.localStorage.removeItem("jbysb_last_recs");
      window.sessionStorage.removeItem("jbysb_last_chat");
    } catch {}
    router.push("/");
  };

  return (
    <button
      type="button"
      onClick={startNew}
      className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
    >
      New Session
    </button>
  );
}
