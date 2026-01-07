import { Helmet } from "react-helmet-async";
import type { Battle } from "../types";
import { format } from "date-fns";

interface BattleMetaProps {
  battle: Battle;
  participantCount?: number;
}

export default function BattleMeta({ battle, participantCount }: BattleMetaProps) {
  const baseUrl = window.location.origin;
  const battleUrl = `${baseUrl}/battle/${battle.id}`;
  
  // Format battle details for description
  const startTime = format(new Date(battle.start_time), "PPpp");
  const ratingRange = `${battle.min_rating}-${battle.max_rating}`;
  const participants = participantCount ? `${participantCount} participant${participantCount !== 1 ? 's' : ''}` : '';
  
  const description = `${battle.title} • ${battle.num_problems} problems • ${battle.duration_min} minutes • Rating: ${ratingRange}${participants ? ` • ${participants}` : ''} • Starts: ${startTime}`;
  
  // Status emoji for visual appeal
  const statusEmoji = {
    pending: "⏳",
    in_progress: "🔥",
    completed: "✅"
  }[battle.status] || "🎯";
  
  const title = `${statusEmoji} ${battle.title} | CP Battles`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={battleUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content="CP Battles" />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_card" />
      <meta property="twitter:url" content={battleUrl} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      
      {/* Additional metadata */}
      <meta property="og:locale" content="en_US" />
      <meta name="robots" content="index, follow" />
      
      {/* Structured data for better SEO */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Event",
          "name": battle.title,
          "description": description,
          "startDate": battle.start_time,
          "duration": `PT${battle.duration_min}M`,
          "eventStatus": battle.status === "completed" 
            ? "https://schema.org/EventScheduled" 
            : battle.status === "in_progress"
            ? "https://schema.org/EventScheduled"
            : "https://schema.org/EventScheduled",
          "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
          "location": {
            "@type": "VirtualLocation",
            "url": battleUrl
          },
          "organizer": {
            "@type": "Organization",
            "name": "CP Battles",
            "url": baseUrl
          }
        })}
      </script>
    </Helmet>
  );
}
