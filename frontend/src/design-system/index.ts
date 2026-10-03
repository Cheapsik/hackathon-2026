/*
 * Public API of the Castor design system. Feature code imports from '@/design-system' only — never from the
 * folders below. Rules: frontend/design/DESIGN.md.
 */

// Primitives
export { AppShell, type AppShellNavItem, type AppShellProps } from './primitives/AppShell'
export { AssetField, type AssetFieldProps } from './primitives/AssetField'
export { Avatar, type AvatarProps } from './primitives/Avatar'
export { Badge, type BadgeProps } from './primitives/Badge'
export { BottomActionDock, type BottomActionDockProps } from './primitives/BottomActionDock'
export { BottomSheet, type BottomSheetProps } from './primitives/BottomSheet'
export { CeramicCard, type CeramicCardProps } from './primitives/CeramicCard'
export { CheckboxField, type CheckboxFieldProps } from './primitives/CheckboxField'
export { DesignSystemProvider } from './primitives/DesignSystemProvider'
export { EmptyState, type EmptyStateProps } from './primitives/EmptyState'
export { ErrorState, type ErrorStateProps } from './primitives/ErrorState'
export { Field, TextAreaField, TextField, type FieldControlProps, type FieldProps } from './primitives/Field'
export { GlassPanel, type GlassPanelProps } from './primitives/GlassPanel'
export { IconButton, type IconButtonProps } from './primitives/IconButton'
export { ImageFallback, type ImageFallbackProps } from './primitives/ImageFallback'
export { ListRow, type ListRowProps } from './primitives/ListRow'
export { LoadingState, type LoadingStateProps } from './primitives/LoadingState'
export { MetricValue, type MetricTrend, type MetricValueProps } from './primitives/MetricValue'
export { Modal, type ModalProps } from './primitives/Modal'
export { PageContainer, type PageContainerProps } from './primitives/PageContainer'
export { Pill, type PillProps } from './primitives/Pill'
export { SearchField, type SearchFieldProps } from './primitives/SearchField'
export { Section, type SectionProps } from './primitives/Section'
export { SegmentedControl, type SegmentedControlProps, type SegmentedOption } from './primitives/SegmentedControl'
export { SelectField, type SelectFieldProps, type SelectOption } from './primitives/SelectField'
export { Skeleton, type SkeletonProps } from './primitives/Skeleton'
export { SoftButton, type SoftButtonProps } from './primitives/SoftButton'
export { SwitchField, type SwitchFieldProps } from './primitives/SwitchField'
export { Tabs, type TabItem, type TabsProps } from './primitives/Tabs'
export { Tooltip, type TooltipProps } from './primitives/Tooltip'
export { TopBar, type TopBarProps } from './primitives/TopBar'
export { useToast, type ToastMessage, type ToastTone } from './primitives/use-toast'
export { UtilityMenu, type UtilityMenuProps } from './primitives/UtilityMenu'

// Patterns — data and callbacks in, no routes, no fetching
export { AssetPair, type AssetPairProps } from './patterns/AssetPair'
export { BandSection, type BandSectionProps } from './patterns/BandSection'
export { CardCarousel, type CardCarouselProps } from './patterns/CardCarousel'
export { CategoryOrbit, type CategoryOrbitProps, type OrbitCategory } from './patterns/CategoryOrbit'
export { ChartPanel, type ChartPanelProps, type ChartPoint } from './patterns/ChartPanel'
export { ConfirmationPanel, type ConfirmationPanelProps } from './patterns/ConfirmationPanel'
export { CurvedContentSheet, type CurvedContentSheetProps } from './patterns/CurvedContentSheet'
export { DataList, type DataListItem, type DataListProps } from './patterns/DataList'
export { FilterBar, type FilterBarProps, type FilterOption } from './patterns/FilterBar'
export { ImmersiveHero, type ImmersiveHeroProps } from './patterns/ImmersiveHero'
export { MediaRail, type MediaRailItem, type MediaRailProps } from './patterns/MediaRail'
export { MetricGroup, type MetricGroupItem, type MetricGroupProps } from './patterns/MetricGroup'
export { ProfileSummary, type ProfileSummaryProps } from './patterns/ProfileSummary'
export { PromptCard, type PromptCardProps, type PromptCardVoice } from './patterns/PromptCard'
export { RuledList, type RuledListItem, type RuledListProps } from './patterns/RuledList'
export { SearchAndFilters, type SearchAndFiltersProps } from './patterns/SearchAndFilters'
export { SettingsGroup, type SettingsGroupProps } from './patterns/SettingsGroup'
export { TransactionPanel, type TransactionPanelProps } from './patterns/TransactionPanel'

// Page templates
export { AuthTemplate, type AuthTemplateProps } from './templates/AuthTemplate'
export {
  CollectionTemplate,
  type CollectionStatus,
  type CollectionTemplateProps,
} from './templates/CollectionTemplate'
export { FormFlowTemplate, type FormFlowStep, type FormFlowTemplateProps } from './templates/FormFlowTemplate'
export { ImmersiveDetailTemplate, type ImmersiveDetailTemplateProps } from './templates/ImmersiveDetailTemplate'
export { OverviewTemplate, type OverviewTemplateProps } from './templates/OverviewTemplate'
export { SettingsTemplate, type SettingsSection, type SettingsTemplateProps } from './templates/SettingsTemplate'
export { StartTemplate, type StartTemplateProps } from './templates/StartTemplate'
export {
  TransactionTemplate,
  type TransactionStage,
  type TransactionTemplateProps,
} from './templates/TransactionTemplate'
