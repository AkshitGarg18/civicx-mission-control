import { PhoneCall } from "lucide-react";
import { contactToneClass, type EmergencyContact } from "@/lib/emergency-data";
import { cn } from "@/lib/utils";

/** One configured emergency line. The call always goes through confirmation. */
export function EmergencyContactCard({
  contact,
  onCall,
  highlight = false,
}: {
  contact: EmergencyContact;
  onCall: (contact: EmergencyContact) => void;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "glass-soft flex h-full flex-col rounded-2xl p-5 transition-colors",
        highlight && "border-destructive/45 bg-destructive/5",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{contact.service}</p>
          <span
            className={cn(
              "mt-2 inline-flex rounded-lg border px-2 py-0.5 font-mono text-[9px] tracking-[0.14em]",
              contactToneClass[contact.tone],
            )}
          >
            {contact.type.toUpperCase()}
          </span>
        </div>
        <p className="shrink-0 font-mono text-2xl font-semibold tracking-tight">
          {contact.number}
        </p>
      </div>

      <p className="mt-3 flex-1 text-xs leading-relaxed text-muted-foreground">{contact.note}</p>

      <button
        type="button"
        onClick={() => onCall(contact)}
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-destructive/45 bg-destructive/10 px-4 py-2.5 font-mono text-[10px] font-semibold tracking-[0.18em] text-destructive transition-colors hover:bg-destructive/20"
      >
        <PhoneCall className="h-3.5 w-3.5" />
        CALL NOW
      </button>
    </div>
  );
}
