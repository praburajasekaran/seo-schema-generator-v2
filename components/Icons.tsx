import React from 'react';
import {
  Sparkles,
  Wand2,
  AlertCircle,
  Clipboard,
  Check,
  Square,
  MessageSquare,
  X,
  Bug,
  Lightbulb,
  MessageCircle,
  Send,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  ChevronDown,
  ChevronRight,
  User,
  Building,
  Globe,
  Edit,
  Trash2,
  Save,
  Plus
} from 'lucide-react';

type IconProps = React.SVGProps<SVGSVGElement>;

// Custom LogoIcon - keeping this as it's brand-specific
export const LogoIcon: React.FC<IconProps> = (props) => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M14 6L12 12L10 6H7L11 18H13L17 6H14Z" fill="url(#grad1)" />
    <path d="M7 3H4V6H7V3Z" fill="url(#grad2)" />
    <path d="M17 3H20V6H17V3Z" fill="url(#grad2)" />
    <defs>
      <linearGradient id="grad1" x1="12" y1="6" x2="12" y2="18" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F472B6" />
        <stop offset="1" stopColor="#A78BFA" />
      </linearGradient>
      <linearGradient id="grad2" x1="4" y1="3" x2="20" y2="3" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F472B6" />
        <stop offset="1" stopColor="#EF4444" />
      </linearGradient>
    </defs>
  </svg>
);

// Lucide React icons with consistent naming
export const SparklesIcon: React.FC<IconProps> = (props) => <Sparkles {...props} />;
export const MagicWandIcon: React.FC<IconProps> = (props) => <Wand2 {...props} />;
export const ErrorIcon: React.FC<IconProps> = (props) => <AlertCircle {...props} />;
export const ClipboardIcon: React.FC<IconProps> = (props) => <Clipboard {...props} />;
export const CheckIcon: React.FC<IconProps> = (props) => <Check {...props} />;
export const StopIcon: React.FC<IconProps> = (props) => <Square {...props} />;
export const FeedbackIcon: React.FC<IconProps> = (props) => <MessageSquare {...props} />;
export const CloseIcon: React.FC<IconProps> = (props) => <X {...props} />;
export const BugIcon: React.FC<IconProps> = (props) => <Bug {...props} />;
export const LightbulbIcon: React.FC<IconProps> = (props) => <Lightbulb {...props} />;
export const ChatBubbleIcon: React.FC<IconProps> = (props) => <MessageCircle {...props} />;
export const SendIcon: React.FC<IconProps> = (props) => <Send {...props} />;
export const CheckCircleIcon: React.FC<IconProps> = (props) => <CheckCircle {...props} />;
export const ExclamationTriangleIcon: React.FC<IconProps> = (props) => <AlertTriangle {...props} />;
export const XCircleIcon: React.FC<IconProps> = (props) => <XCircle {...props} />;
export const InformationCircleIcon: React.FC<IconProps> = (props) => <Info {...props} />;
export const ChevronDownIcon: React.FC<IconProps> = (props) => <ChevronDown {...props} />;
export const ChevronRightIcon: React.FC<IconProps> = (props) => <ChevronRight {...props} />;
export const UserIcon: React.FC<IconProps> = (props) => <User {...props} />;
export const BuildingIcon: React.FC<IconProps> = (props) => <Building {...props} />;
export const GlobeIcon: React.FC<IconProps> = (props) => <Globe {...props} />;
export const EditIcon: React.FC<IconProps> = (props) => <Edit {...props} />;
export const TrashIcon: React.FC<IconProps> = (props) => <Trash2 {...props} />;
export const SaveIcon: React.FC<IconProps> = (props) => <Save {...props} />;
export const PlusIcon: React.FC<IconProps> = (props) => <Plus {...props} />;
export const XIcon: React.FC<IconProps> = (props) => <X {...props} />;