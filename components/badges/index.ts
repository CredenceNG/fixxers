// Badge Display Components
export { default as BadgeDisplay } from "./BadgeDisplay";
export type { BadgeData } from "./BadgeDisplay";

export { default as BadgeGroup } from "./BadgeGroup";

export { default as TierBadge, TierProgress } from "./TierBadge";
export type { BadgeTier } from "./TierBadge";

export {
  default as VerifiedIndicator,
  VerifiedCheckmark,
} from "./VerifiedIndicator";

export { default as BadgeCard, BadgeCardCompact } from "./BadgeCard";

export {
  default as UserBadgeShowcase,
  ProfileBadgeHeader,
  SearchResultBadgeDisplay,
} from "./UserBadgeShowcase";

// Action Components (already exist from previous phases)
export { BadgeDocumentUpload } from "./BadgeDocumentUpload";
export { BadgeSuccessAlert } from "./BadgeSuccessAlert";
export { default as BadgeReviewActions } from "./BadgeReviewActions";
