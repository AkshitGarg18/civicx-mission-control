import { useState } from "react";
import { Reveal, SectionLabel } from "@/components/civicx/Reveal";
import { NodeNetwork } from "@/components/civicx/NodeNetwork";
import { ChallengePanel } from "@/components/civicx/ChallengePanel";
import { CategoryDot, PriorityChip } from "@/components/civicx/StatusChip";
import type { ChallengeNode } from "@/lib/civicx-data";
import { nearbyChallenges } from "@/lib/citizen-data";

/** Community signal map: glowing nodes that open a mission dossier. */
export function NearbyChallenges() {
  const [selected, setSelected] = useState<ChallengeNode | null>(null);

  return (
    <section id="nearby" className="scroll-mt-24">
      <Reveal>
        <SectionLabel>CHALLENGES NEAR YOU</SectionLabel>
        <p className="mt-3 text-sm text-muted-foreground">
          Explore civic signals around your community.
        </p>
      </Reveal>

      <Reveal delay={0.08} className="mt-6">
        <div className="glass grid-floor relative overflow-hidden rounded-[1.75rem] p-4 sm:p-6">
          <div className="relative h-[26rem] w-full sm:h-[30rem]">
            <NodeNetwork
              nodes={nearbyChallenges}
              autoLink
              ambient
              showLabels={false}
              onSelect={setSelected}
            />
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {nearbyChallenges.slice(0, 6).map((node) => (
              <button
                key={node.id}
                type="button"
                onClick={() => setSelected(node)}
                className="glass-soft flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:border-cyan/40"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <CategoryDot category={node.category} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm">{node.name}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {node.location} • {node.affected}
                    </span>
                  </span>
                </span>
                <PriorityChip priority={node.priority} />
              </button>
            ))}
          </div>
        </div>
      </Reveal>

      <ChallengePanel node={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
