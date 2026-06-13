'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { signOut } from '@/lib/auth/actions';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/lib/types';

interface UserMenuProps {
  user: User;
  profile: Profile;
}

export function UserMenu({ profile }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = profile.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-[#E5DFD5] transition-colors"
      >
        <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
          <span className="text-sm font-semibold text-stone-900">{initials}</span>
        </div>
        <svg
          className={`w-4 h-4 text-stone-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-[#EDE8DF] rounded-lg shadow-lg border border-[#CFC8BC] py-1 z-50">
          <div className="px-4 py-3 border-b border-[#CFC8BC]">
            <p className="text-sm font-medium text-stone-900">{profile.full_name}</p>
            <p className="text-xs text-stone-500">{profile.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-[#E5DFD5] text-stone-600 rounded">
              {profile.role === 'employer' ? 'Employer' : 'Job Seeker'}
            </span>
          </div>

          <Link
            href="/dashboard"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-2 text-sm text-stone-700 hover:bg-[#E5DFD5]"
          >
            Dashboard
          </Link>

          <Link
            href="/dashboard/profile"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-2 text-sm text-stone-700 hover:bg-[#E5DFD5]"
          >
            Edit Profile
          </Link>

          {profile.role === 'employer' && (
            <Link
              href="/dashboard/jobs"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-sm text-stone-700 hover:bg-[#E5DFD5]"
            >
              Manage Jobs
            </Link>
          )}

          <div className="border-t border-[#CFC8BC] mt-1">
            <form action={signOut}>
              <button
                type="submit"
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
