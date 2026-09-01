import type { Asc } from '@/lib/supabase';
import { initials } from '@/lib/helpers';

export function AscAvatar({
  asc,
  size = 'md',
}: {
  asc: Pick<Asc, 'name' | 'logo_color' | 'logo_url'>;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
  };

  if (asc.logo_url) {
    const imgSizes = {
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-14 h-14',
      xl: 'w-20 h-20',
    };
    return (
      <img
        src={asc.logo_url}
        alt={asc.name}
        className={`${imgSizes[size]} rounded-full object-cover shrink-0 shadow-lg ring-1 ring-white/10`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-bold text-white shrink-0 shadow-lg`}
      style={{
        background: `linear-gradient(135deg, ${asc.logo_color}, ${asc.logo_color}99)`,
      }}
    >
      {initials(asc.name.replace(/^ASC\s+/i, ''))}
    </div>
  );
}

export function PlayerAvatar({
  firstName,
  lastName,
  color = '#10B981',
  photoUrl,
  size = 'md',
}: {
  firstName: string;
  lastName: string;
  color?: string;
  photoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizes = {
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-11 h-11 text-sm',
    lg: 'w-16 h-16 text-lg',
  };
  const imgSizes = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
  };

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={`${firstName} ${lastName}`}
        className={`${imgSizes[size]} rounded-full object-cover shrink-0 ring-1 ring-white/10`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-bold text-white shrink-0`}
      style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}
    >
      {(firstName[0] ?? '') + (lastName[0] ?? '')}
    </div>
  );
}
