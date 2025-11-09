import {
  BookOpenText,
  Cake,
  Cigarette,
  GraduationCap,
  Home,
  Languages,
  Ruler,
  Search,
  Sparkles,
  University,
  User,
  Wine,
} from "lucide-react";
import {
  Item,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item";
import type { ProfileCardInfoProps } from "../types";
import { calculateAge } from "../utils";

export function ProfileCardInfo({ profile }: ProfileCardInfoProps) {
  const age = calculateAge(profile.birthDate);

  return (
    <ItemGroup className="rounded-lg border bg-card">
      {/* Row 1: Quick Info (age, gender, height, zodiac, drinking, smoking) */}
      <Item
        className="custom-scrollbar h-full flex-nowrap items-center gap-0 overflow-x-auto"
        size="sm"
      >
        {/* Pill: Age */}
        <div className="inline-flex flex-none items-center gap-1.5">
          <ItemMedia variant="default">
            <Cake className="size-4" />
          </ItemMedia>
          <ItemTitle className="whitespace-nowrap">{age}</ItemTitle>
        </div>

        <ItemSeparator
          className="mx-3 min-[500px]:mx-6 min-[600px]:mx-8"
          orientation="vertical"
        />

        {/* Pill: Gender */}
        <div className="inline-flex flex-none items-center gap-1.5">
          <ItemMedia variant="default">
            <User className="size-4" />
          </ItemMedia>
          <ItemTitle className="whitespace-nowrap">{profile.gender}</ItemTitle>
        </div>

        {profile.height && (
          <>
            <ItemSeparator
              className="mx-3 min-[500px]:mx-6 min-[600px]:mx-8"
              orientation="vertical"
            />

            {/* Pill: Height */}
            <div className="inline-flex flex-none items-center gap-1.5">
              <ItemMedia variant="default">
                <Ruler className="size-4" />
              </ItemMedia>
              <ItemTitle className="whitespace-nowrap">
                {profile.height}
              </ItemTitle>
            </div>
          </>
        )}

        {profile.zodiac && (
          <>
            <ItemSeparator
              className="mx-3 min-[500px]:mx-6 min-[600px]:mx-8"
              orientation="vertical"
            />

            {/* Pill: Zodiac */}
            <div className="inline-flex flex-none items-center gap-1.5">
              <ItemMedia variant="default">
                <Sparkles className="size-4" />
              </ItemMedia>
              <ItemTitle className="whitespace-nowrap">
                {profile.zodiac}
              </ItemTitle>
            </div>
          </>
        )}

        {profile.drinking && profile.drinking !== "Prefer not to say" && (
          <>
            <ItemSeparator
              className="mx-3 min-[500px]:mx-6 min-[600px]:mx-8"
              orientation="vertical"
            />

            {/* Pill: Drinking */}
            <div className="inline-flex flex-none items-center gap-1.5">
              <ItemMedia variant="default">
                <Wine className="size-4" />
              </ItemMedia>
              <ItemTitle className="whitespace-nowrap">
                {profile.drinking}
              </ItemTitle>
            </div>
          </>
        )}

        {profile.smoking && profile.smoking !== "Prefer not to say" && (
          <>
            <ItemSeparator
              className="mx-3 min-[500px]:mx-6 min-[600px]:mx-8"
              orientation="vertical"
            />

            {/* Pill: Smoking */}
            <div className="inline-flex flex-none items-center gap-1.5">
              <ItemMedia variant="default">
                <Cigarette className="size-4" />
              </ItemMedia>
              <ItemTitle className="whitespace-nowrap">
                {profile.smoking}
              </ItemTitle>
            </div>
          </>
        )}
      </Item>

      <ItemSeparator />

      {/* Row 2: Year */}
      <Item size="sm">
        <ItemMedia variant="default">
          <GraduationCap className="size-4" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{profile.year}</ItemTitle>
        </ItemContent>
      </Item>

      <ItemSeparator />

      {/* Row 3: Major */}
      <Item size="sm">
        <ItemMedia variant="default">
          <BookOpenText className="size-4" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{profile.major}</ItemTitle>
        </ItemContent>
      </Item>

      {profile.university && (
        <>
          <ItemSeparator />

          {/* Row 4: University */}
          <Item size="sm">
            <ItemMedia variant="default">
              <University className="size-4" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{profile.university}</ItemTitle>
            </ItemContent>
          </Item>
        </>
      )}

      {profile.hometown && (
        <>
          <ItemSeparator />

          {/* Row 5: Hometown */}
          <Item size="sm">
            <ItemMedia variant="default">
              <Home className="size-4" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{profile.hometown}</ItemTitle>
            </ItemContent>
          </Item>
        </>
      )}

      {profile.relationshipGoals &&
        profile.relationshipGoals !== "Prefer not to say" && (
          <>
            <ItemSeparator />

            {/* Row 6: Relationship Goals */}
            <Item size="sm">
              <ItemMedia variant="default">
                <Search className="size-4" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{profile.relationshipGoals}</ItemTitle>
              </ItemContent>
            </Item>
          </>
        )}

      {profile.languages && profile.languages.length > 0 && (
        <>
          <ItemSeparator />

          {/* Row 7: Languages */}
          <Item size="sm">
            <ItemMedia variant="default">
              <Languages className="size-4" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{profile.languages.join(", ")}</ItemTitle>
            </ItemContent>
          </Item>
        </>
      )}
    </ItemGroup>
  );
}
