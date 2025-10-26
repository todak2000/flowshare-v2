import { Skeleton } from "../ui/skeleton";

export function LayoutSkeleton() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar Skeleton */}
      <aside className="hidden w-60 flex-col border-r bg-muted/30 p-4 md:flex">
        {/* Logo/Title Skeleton */}
        <div className="mb-8">
          <Skeleton className="h-8 w-32" />
        </div>
        {/* Nav Links Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-4/5" />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        {/* Header Skeleton */}
        <header className="flex h-16 items-center justify-between border-b px-6">
          {/* Page Title Skeleton */}
          <Skeleton className="h-6 w-48" />
          {/* User/Profile Skeleton */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </header>

        {/* Dashboard Widgets Grid */}
        <main className="flex-1 p-6">
          <div className="space-y-6">
            {/* Stat Cards Skeleton (3-col) */}
            <div className="grid gap-6 md:grid-cols-3">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>

            {/* Main Charts Skeleton (2/3 + 1/3) */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Main Chart */}
              <Skeleton className="h-80 w-full lg:col-span-2" />
              {/* Side Chart/List */}
              <Skeleton className="h-80 w-full" />
            </div>

            {/* Full-width Table Skeleton */}
            <div>
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
