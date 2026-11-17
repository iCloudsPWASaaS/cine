/* eslint-disable @next/next/no-img-element */
"use client";

import { useId, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { uploadImageAction } from "@/app/admin/actions/storage";

interface ImageUrlFieldProps {
  name: string;
  label: string;
  defaultValue?: string | null;
  folder?: string;
  hint?: string;
}

export function ImageUrlField({
  name,
  label,
  defaultValue,
  folder = "uploads",
  hint,
}: ImageUrlFieldProps) {
  const id = useId();
  const [value, setValue] = useState(defaultValue || "");
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);

  const onUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setStatus("");
    const data = new FormData();
    data.set("file", file);
    data.set("folder", folder);
    const result = await uploadImageAction(data);
    setUploading(false);
    if (result.error) {
      setStatus(result.error);
      return;
    }
    if (result.url) {
      setValue(result.url);
      setStatus("Uploaded to Supabase Storage.");
    }
  };

  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          name={name}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="https://…"
          className="input"
        />
        <label className="btn-ghost shrink-0 cursor-pointer !px-3.5">
          {uploading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Upload size={15} />
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => onUpload(event.target.files?.[0])}
          />
        </label>
      </div>
      {hint ? <p className="mt-1 text-[11px] text-white/30">{hint}</p> : null}
      {status ? (
        <p
          className={`mt-1 text-[11px] ${
            status.startsWith("Uploaded") ? "text-emerald-300" : "text-red-300"
          }`}
        >
          {status}
        </p>
      ) : null}
      {value ? (
        <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-2">
          <img
            src={value}
            alt="Preview"
            className="h-16 w-12 rounded-lg object-cover"
          />
          <span className="truncate text-[11px] text-white/35">{value}</span>
        </div>
      ) : null}
    </div>
  );
}
