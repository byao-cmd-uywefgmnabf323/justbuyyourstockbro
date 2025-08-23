"use client";
import React from "react";
import Link from "next/link";

export default function Profile() {
  return (
    <section className="border border-gray-300 bg-white p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold text-black">Profile & Settings</h2>
        <Link href="/onboarding" className="text-sm text-black hover:underline">Update</Link>
      </div>
      <p className="text-sm text-black">Update your investor profile to get personalized recommendations.</p>
      <div className="mt-3">
        <Link href="/onboarding" className="inline-flex items-center border border-gray-900 bg-black text-white px-4 py-2 rounded-none text-sm">
          Update Profile
        </Link>
      </div>
    </section>
  );
}
