'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import ContentRow from '@/components/ContentRow';
import LoadingSkeleton from '@/components/LoadingSkeleton';

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [music, setMusic] = useState([]);

  useEffect(() => {
    const profile = localStorage.getItem('selected_profile');
    if (!profile) {
      router.push('/profiles');
      return;
    }
    if (query) {
      searchContent();
    }
  }, [router, query]);

  const searchContent = async () => {
    const token = localStorage.getItem('access_token');
    setLoading(true);

    try {
      const [videoData, musicData] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/user/videos/?search=${query}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }).then(res => res.json()),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/user/music/?search=${query}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }).then(res => res.json()),
      ]);

      setVideos(videoData);
      setMusic(musicData);
    } catch (err) {
      console.error('Failed to search', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-20 px-4 sm:px-6 md:px-8 py-8 md:py-12">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Search Results for "{query}"</h1>
      <p className="text-gray-400 text-sm sm:text-base mb-6 md:mb-8">
        Found {videos.length + music.length} results
      </p>

      {loading ? (
        <>
          <h2 className="text-2xl font-bold mb-4 px-8">Videos</h2>
          <LoadingSkeleton />
          <h2 className="text-2xl font-bold mb-4 px-8 mt-8">Music</h2>
          <LoadingSkeleton />
        </>
      ) : (
        <>
          {videos.length > 0 && (
            <ContentRow title="Videos" items={videos} />
          )}

          {music.length > 0 && (
            <div className="mt-8">
              <ContentRow title="Music" items={music} type="music" />
            </div>
          )}

          {videos.length === 0 && music.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-400 text-xl">No results found</p>
              <p className="text-gray-500 mt-2">Try searching with different keywords</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <Suspense fallback={
        <div className="pt-20 px-4 sm:px-8 py-12">
          <LoadingSkeleton />
        </div>
      }>
        <SearchContent />
      </Suspense>
    </div>
  );
}
