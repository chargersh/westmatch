"use client";

import type { Photo, Profile, Prompt } from "@/features/profile";
import { ProfileCard } from "@/features/profile";

// Fake data for testing
const fakeProfile: Profile = {
  _id: "test-profile-id" as any,
  _creationTime: Date.now(),
  userId: "test-user-id",
  displayName: "Alex Johnson",
  gender: "male",
  interestedIn: "female",
  birthDate: new Date(2005, 2, 8).getTime(),
  year: "junior",
  major: "Computer Science",
  bio: "Love hiking, coding, and trying new coffee shops. Always down for a spontaneous road trip!",
  height: 180,
  drinking: "Sometimes",
  smoking: "No",
  university: "Stanford University",
  hometown: "San Francisco, CA",
  zodiac: "Pisces",
  relationshipGoals: "Long-term relationship",
  languages: ["English", "Spanish", "French"],
  preferredYears: {
    freshman: false,
    sophomore: false,
    junior: true,
    senior: true,
  },
  profileComplete: true,
  isActive: true,
  updatedAt: Date.now(),
};

const fakePhoto1: Photo = {
  _id: "photo-1" as any,
  _creationTime: Date.now(),
  id: "photo-1",
  profileId: "test-profile-id" as any,
  key: "photo-1-key",
  orderIndex: 0,
  url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop",
};

const fakePhoto2: Photo = {
  _id: "photo-2" as any,
  _creationTime: Date.now(),
  id: "photo-2",
  profileId: "test-profile-id" as any,
  key: "photo-2-key",
  orderIndex: 1,
  url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&h=500&fit=crop",
};

const fakePhoto3: Photo = {
  _id: "photo-3" as any,
  _creationTime: Date.now(),
  id: "photo-3",
  profileId: "test-profile-id" as any,
  key: "photo-3-key",
  orderIndex: 2,
  url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&h=500&fit=crop",
};

const fakePrompt1: Prompt = {
  _id: "prompt-1" as any,
  _creationTime: Date.now(),
  id: "prompt-1",
  profileId: "test-profile-id" as any,
  promptId: "all_i_ask",
  answer: "actually message me after matching",
  orderIndex: 0,
};

const fakePrompt2: Prompt = {
  _id: "prompt-2" as any,
  _creationTime: Date.now(),
  id: "prompt-2",
  profileId: "test-profile-id" as any,
  promptId: "geek_out_on",
  answer:
    "Good communication, sense of humor, and being kind to service workers",
  orderIndex: 1,
};

const fakePrompt3: Prompt = {
  _id: "prompt-3" as any,
  _creationTime: Date.now(),
  id: "prompt-3",
  profileId: "test-profile-id" as any,
  promptId: "green_flags",
  answer:
    "Good communication, sense of humor, and being kind to service workers",
  orderIndex: 2,
};

export default function TestingPage() {
  const handlePhotoLike = (photoId: string) => {
    console.log("Liked photo:", photoId);
  };

  const handlePromptLike = (promptId: string) => {
    console.log("Liked prompt:", promptId);
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 font-bold text-2xl">Evan</h1>

      <ProfileCard.Root>
        <ProfileCard.Photo onLike={handlePhotoLike} photo={fakePhoto1} />
        <ProfileCard.Prompt onLike={handlePhotoLike} prompt={fakePrompt1} />
        <ProfileCard.Info profile={fakeProfile} />
        <ProfileCard.Photo onLike={handlePhotoLike} photo={fakePhoto2} />
        <ProfileCard.Prompt onLike={handlePromptLike} prompt={fakePrompt2} />
        <ProfileCard.Photo onLike={handlePhotoLike} photo={fakePhoto3} />
        <ProfileCard.Prompt onLike={handlePromptLike} prompt={fakePrompt3} />
      </ProfileCard.Root>
    </div>
  );
}
