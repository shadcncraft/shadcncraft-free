import {
  ProfileCard,
  ProfileCardAvatar,
  ProfileCardDetails,
} from "@/registry/pro-marketing/ui/profile-card";
import {
  SectionHeading,
  SectionHeadingBody,
  SectionHeadingTagline,
  SectionHeadingTitle,
} from "@/registry/pro-marketing/ui/section-heading";

export type Team6Member = { name: string; title?: string; imageSrc?: string };

export type Team6Props = {
  /** Section id, so links like "#pricing" can jump here. */
  anchor?: string;
  tagline?: string;
  heading?: string;
  description?: string;
  members?: Team6Member[];
};

export function Team6({
  anchor,
  tagline = "Team",
  heading = "Meet The People Behind Acme AI",
  description = "We are a team of builders, designers, and problem-solvers dedicated to helping you work smarter every day.",
  members = teamMembersData,
}: Team6Props = {}) {
  return (
    <section id={anchor} className="py-12 lg:py-20">
      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-5 lg:gap-16 lg:px-8">
        {/* Section Heading */}
        <SectionHeading alignment="center" className="mx-auto w-full max-w-3xl">
          {tagline && <SectionHeadingTagline>{tagline}</SectionHeadingTagline>}
          <SectionHeadingTitle>{heading}</SectionHeadingTitle>
          {description && <SectionHeadingBody>{description}</SectionHeadingBody>}
        </SectionHeading>

        {/* Team Members */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-9">
          {members.map((member, index) => (
            <ProfileCard
              key={index}
              variant="default"
              className="rounded-xl border bg-card p-2 shadow-sm"
            >
              <ProfileCardAvatar
                src={member.imageSrc ?? ""}
                name={member.name}
                className="size-32 rounded-lg"
              />
              <ProfileCardDetails
                className="self-end-safe border-l-2 border-primary pl-2"
                name={member.name}
                body={member.title}
              />
            </ProfileCard>
          ))}
        </div>
      </div>
    </section>
  );
}

const teamMembersData: Team6Member[] = [
  {
    name: "Sophie Tan",
    title: "Founder & CEO",
    imageSrc: "https://free.shadcraft.com/assets/avatars/person-1.webp",
  },
  {
    name: "Liam Johnson",
    title: "Chief Technology Officer",
    imageSrc: "https://free.shadcraft.com/assets/avatars/person-2.webp",
  },
  {
    name: "Ava Smith",
    title: "Head of Marketing",
    imageSrc: "https://free.shadcraft.com/assets/avatars/person-3.webp",
  },
  {
    name: "Noah Brown",
    title: "Product Manager",
    imageSrc: "https://free.shadcraft.com/assets/avatars/person-4.webp",
  },
  {
    name: "Emma Wilson",
    title: "Lead Designer",
    imageSrc: "https://free.shadcraft.com/assets/avatars/person-5.webp",
  },
  {
    name: "Oliver Lee",
    title: "Data Analyst",
    imageSrc: "https://free.shadcraft.com/assets/avatars/person-6.webp",
  },
];
