import {
  BookOpenText,
  Cake,
  Cigarette,
  GraduationCap,
  Home,
  Languages,
  type LucideIcon,
  Ruler,
  Search,
  Sparkles,
  University,
  User,
  Wine,
} from "lucide-react";
import { Fragment, type ReactElement } from "react";
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

function Pill({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string | number;
}) {
  return (
    <div className="inline-flex shrink-0 items-center gap-2.5">
      <ItemMedia variant="default">
        <Icon className="size-4" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle className="whitespace-nowrap">{label}</ItemTitle>
      </ItemContent>
    </div>
  );
}

function buildQuickInfoPills(profile: ProfileCardInfoProps["profile"]) {
  const pills: ReactElement[] = [];
  const age = calculateAge(profile.birthDate);

  pills.push(<Pill icon={Cake} key="age" label={age} />);
  pills.push(<Pill icon={User} key="gender" label={profile.gender} />);

  if (profile.height) {
    pills.push(<Pill icon={Ruler} key="height" label={profile.height} />);
  }

  if (profile.zodiac) {
    pills.push(<Pill icon={Sparkles} key="zodiac" label={profile.zodiac} />);
  }

  if (profile.drinking && profile.drinking !== "Prefer not to say") {
    pills.push(<Pill icon={Wine} key="drinking" label={profile.drinking} />);
  }

  if (profile.smoking && profile.smoking !== "Prefer not to say") {
    pills.push(<Pill icon={Cigarette} key="smoking" label={profile.smoking} />);
  }

  return pills;
}

function ProfileInfoRow({
  icon: Icon,
  content,
}: {
  icon: LucideIcon;
  content: string | string[];
}) {
  const displayContent = Array.isArray(content) ? content.join(", ") : content;
  return (
    <Item size="sm">
      <ItemMedia variant="default">
        <Icon className="size-4" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{displayContent}</ItemTitle>
      </ItemContent>
    </Item>
  );
}

function QuickInfoRow({ pills }: { pills: ReactElement[] }) {
  if (pills.length === 0) {
    return null;
  }

  if (pills.length === 1) {
    return (
      <Item
        className="w-full flex-nowrap items-center gap-0 overflow-hidden whitespace-nowrap"
        size="sm"
      >
        {pills[0]}
      </Item>
    );
  }

  if (pills.length === 2) {
    return (
      <Item
        className="relative w-full flex-nowrap items-center justify-between gap-0 overflow-hidden whitespace-nowrap"
        size="sm"
      >
        {pills[0]}
        {pills[1]}
        <ItemSeparator
          className="-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute top-1/2 left-1/2 h-4 w-px"
          orientation="vertical"
        />
      </Item>
    );
  }

  return (
    <Item
      className="custom-scrollbar w-full flex-nowrap items-center justify-between gap-6 overflow-x-auto whitespace-nowrap"
      size="sm"
    >
      {pills.map((p, i) => (
        <Fragment key={p.key}>
          <span className="shrink-0">{p}</span>
          {i < pills.length - 1 && <ItemSeparator orientation="vertical" />}
        </Fragment>
      ))}
    </Item>
  );
}

export function ProfileCardInfo({ profile }: ProfileCardInfoProps) {
  const pills = buildQuickInfoPills(profile);

  return (
    <ItemGroup className="rounded-lg border bg-card">
      {/* Row 1: Quick Info (age, gender, height, zodiac, drinking, smoking) */}
      <QuickInfoRow pills={pills} />

      <ItemSeparator />

      {/* Row 2: Year */}
      <ProfileInfoRow content={profile.year} icon={GraduationCap} />

      <ItemSeparator />

      {/* Row 3: Major */}
      <ProfileInfoRow content={profile.major} icon={BookOpenText} />

      {profile.university && (
        <>
          <ItemSeparator />
          <ProfileInfoRow content={profile.university} icon={University} />
        </>
      )}

      {profile.hometown && (
        <>
          <ItemSeparator />
          <ProfileInfoRow content={profile.hometown} icon={Home} />
        </>
      )}

      {profile.relationshipGoals &&
        profile.relationshipGoals !== "Prefer not to say" && (
          <>
            <ItemSeparator />
            <ProfileInfoRow content={profile.relationshipGoals} icon={Search} />
          </>
        )}

      {profile.languages && profile.languages.length > 0 && (
        <>
          <ItemSeparator />
          <ProfileInfoRow content={profile.languages} icon={Languages} />
        </>
      )}
    </ItemGroup>
  );
}
