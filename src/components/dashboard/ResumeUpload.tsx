'use client';

import { useActionState, useState } from 'react';
import { uploadResume, type ActionState } from '@/lib/auth/actions';

interface ResumeUploadProps {
  currentResumeUrl: string | null;
  currentFilename: string | null;
}

export function ResumeUpload({ currentResumeUrl, currentFilename }: ResumeUploadProps) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(uploadResume, {});
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">Resume</label>

        {currentResumeUrl && currentFilename && (
          <div className="mb-4 p-3 bg-[#E5DFD5] rounded-md flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="text-sm text-stone-400">{currentFilename}</span>
            </div>
            <a
              href={currentResumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
            >
              View
            </a>
          </div>
        )}

        <form action={formAction}>
          <div className="border-2 border-dashed border-stone-300 rounded-md p-6 text-center hover:border-yellow-500 transition-colors">
            <input
              type="file"
              name="resume"
              id="resume"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setFileName(e.target.files?.[0]?.name || null)}
              className="hidden"
            />
            <label htmlFor="resume" className="cursor-pointer">
              <svg
                className="mx-auto h-12 w-12 text-stone-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="mt-2 text-sm text-stone-600">
                {fileName || 'Click to upload or drag and drop'}
              </p>
              <p className="mt-1 text-xs text-stone-500">PDF or Word (max 5MB)</p>
            </label>
          </div>

          {fileName && (
            <button
              type="submit"
              disabled={isPending}
              className="mt-4 w-full py-2 px-4 bg-yellow-500 hover:bg-yellow-400 disabled:bg-yellow-300 text-stone-900 font-semibold rounded-md transition-colors"
            >
              {isPending ? 'Uploading...' : 'Upload Resume'}
            </button>
          )}
        </form>

        {state.error && (
          <p className="mt-2 text-sm text-red-600">{state.error}</p>
        )}
        {state.success && (
          <p className="mt-2 text-sm text-green-600">Resume uploaded successfully!</p>
        )}
      </div>
    </div>
  );
}
