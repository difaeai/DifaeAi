# @difae/ui

Shared UI primitives used by the admin workspace. Components are implemented with Tailwind CSS utility classes and keep their source in TypeScript so Next.js can transpile them during builds.

## Available exports

- `cn` utility for merging class names.
- UI components: `Badge`, `Button`, `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `MetricStat`, `Skeleton`.
- Data display primitives: `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow`.
- Navigation helper: `Tabs` with an `items` API tailored for dashboard views.

Import them from the package root, e.g. `import { Button } from '@difae/ui';`.
