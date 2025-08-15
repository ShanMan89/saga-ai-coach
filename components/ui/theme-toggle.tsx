'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  variant?: 'button' | 'dropdown';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ 
  variant = 'dropdown', 
  size = 'default',
  className,
  showLabel = false 
}: ThemeToggleProps) {
  const { theme, setTheme, toggleTheme, resolvedTheme } = useTheme();

  const iconSizes = {
    sm: 'h-3 w-3',
    default: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const getCurrentIcon = () => {
    if (theme === 'light') return Sun;
    if (theme === 'dark') return Moon;
    return Monitor;
  };

  const getCurrentLabel = () => {
    if (theme === 'light') return 'Light';
    if (theme === 'dark') return 'Dark';
    return 'System';
  };

  if (variant === 'button') {
    const Icon = getCurrentIcon();
    
    return (
      <Button
        variant="ghost"
        size={size}
        onClick={toggleTheme}
        className={cn('relative', className)}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'} theme`}
      >
        <Icon className={cn('transition-all duration-200', iconSizes[size])} />
        {showLabel && (
          <span className="ml-2 text-sm">
            {getCurrentLabel()}
          </span>
        )}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size={size}
          className={cn('relative', className)}
          aria-label="Toggle theme"
        >
          <Sun className={cn(
            'transition-all duration-200 rotate-0 scale-100 dark:-rotate-90 dark:scale-0',
            iconSizes[size]
          )} />
          <Moon className={cn(
            'absolute transition-all duration-200 rotate-90 scale-0 dark:rotate-0 dark:scale-100',
            iconSizes[size]
          )} />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        <DropdownMenuItem 
          onClick={() => setTheme('light')}
          className={cn('cursor-pointer', theme === 'light' && 'bg-accent')}
        >
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
          {theme === 'light' && (
            <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('dark')}
          className={cn('cursor-pointer', theme === 'dark' && 'bg-accent')}
        >
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
          {theme === 'dark' && (
            <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('system')}
          className={cn('cursor-pointer', theme === 'system' && 'bg-accent')}
        >
          <Monitor className="mr-2 h-4 w-4" />
          <span>System</span>
          {theme === 'system' && (
            <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Compact theme toggle for mobile or small spaces
export function CompactThemeToggle({ className }: { className?: string }) {
  const { toggleTheme, resolvedTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className={cn('h-8 w-8 p-0', className)}
      aria-label="Toggle theme"
    >
      <Sun className={cn(
        'h-4 w-4 transition-all duration-200',
        resolvedTheme === 'dark' ? 'rotate-90 scale-0' : 'rotate-0 scale-100'
      )} />
      <Moon className={cn(
        'absolute h-4 w-4 transition-all duration-200',
        resolvedTheme === 'dark' ? 'rotate-0 scale-100' : '-rotate-90 scale-0'
      )} />
    </Button>
  );
}

// Theme indicator (just shows current theme, no interaction)
export function ThemeIndicator({ className }: { className?: string }) {
  const { theme, resolvedTheme } = useTheme();
  
  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;
  
  return (
    <div className={cn('flex items-center space-x-2 text-sm text-muted-foreground', className)}>
      <Icon className="h-4 w-4" />
      <span>
        {theme === 'system' ? `System (${resolvedTheme})` : theme}
      </span>
    </div>
  );
}

// Animated theme toggle with smooth transitions
export function AnimatedThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <div className={cn('flex items-center space-x-1 p-1 bg-muted rounded-lg', className)}>
      <Button
        variant={theme === 'light' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setTheme('light')}
        className={cn(
          'h-8 px-3 transition-all duration-200',
          theme === 'light' ? 'shadow-sm' : 'shadow-none'
        )}
      >
        <Sun className="h-4 w-4" />
      </Button>
      <Button
        variant={theme === 'dark' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setTheme('dark')}
        className={cn(
          'h-8 px-3 transition-all duration-200',
          theme === 'dark' ? 'shadow-sm' : 'shadow-none'
        )}
      >
        <Moon className="h-4 w-4" />
      </Button>
      <Button
        variant={theme === 'system' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setTheme('system')}
        className={cn(
          'h-8 px-3 transition-all duration-200',
          theme === 'system' ? 'shadow-sm' : 'shadow-none'
        )}
      >
        <Monitor className="h-4 w-4" />
      </Button>
    </div>
  );
}