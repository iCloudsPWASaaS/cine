import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BrowseView } from "@/components/site/browse-view";
import { getCastMember } from "@/lib/queries";

export const dynamic = "force-dynamic";

interface ActorPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function parseActorId(value: string) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function generateMetadata({
  params,
}: ActorPageProps): Promise<Metadata> {
  const { id: rawId } = await params;
  const id = parseActorId(rawId);
  const person = id ? await getCastMember(id) : null;
  if (!person) return { title: "Cast member" };

  return {
    title: `${person.name} movies`,
    description: `Browse movies featuring ${person.name} on Cinewood.`,
  };
}

export default async function ActorPage({
  params,
  searchParams,
}: ActorPageProps) {
  const [{ id: rawId }, query] = await Promise.all([params, searchParams]);
  const id = parseActorId(rawId);
  const person = id ? await getCastMember(id) : null;
  if (!id || !person) notFound();

  return (
    <BrowseView
      searchParams={query}
      forcedCast={String(id)}
      actionPath={`/actor/${id}`}
      heading={person.name}
      description={`Every Cinewood title featuring ${person.name}.`}
    />
  );
}
