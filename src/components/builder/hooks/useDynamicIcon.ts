import { useMemo } from 'react';
import * as LucideIcons from 'lucide-react';

type IconComponent = React.ForwardRefExoticComponent<LucideIcons.LucideProps & React.RefAttributes<SVGSVGElement>>;

export function useDynamicIcon(iconName: string): IconComponent | null {
  return useMemo(() => {
    const Icon = (LucideIcons as Record<string, unknown>)[iconName];
    if (typeof Icon === 'function') return Icon as IconComponent;
    return null;
  }, [iconName]);
}
