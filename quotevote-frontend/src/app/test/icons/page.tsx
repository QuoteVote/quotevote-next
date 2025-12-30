import {
  Calendar,
  CheckBoxFilled,
  Search,
  Up,
  Down,
  Filter,
  Group,
  Comment,
  Quote,
} from '@/components/Icons';

/**
 * Test page for icon rendering
 * Displays all migrated icons to verify proper rendering, sizing, and styling
 */
export default function IconsTestPage() {
  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Icon Migration Test Page</h1>
        <p className="text-muted-foreground">
          This page displays all migrated icons from Material UI to lucide-react-compatible custom components.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Calendar Icon */}
        <div className="border rounded-lg p-4 space-y-2">
          <h3 className="font-semibold">Calendar</h3>
          <div className="flex items-center gap-4">
            <Calendar size={24} />
            <Calendar size={32} />
            <Calendar size={48} />
          </div>
          <div className="flex items-center gap-4">
            <Calendar size={24} className="text-blue-500" />
            <Calendar size={24} className="text-green-500" />
            <Calendar size={24} className="text-red-500" />
          </div>
        </div>

        {/* Search Icon */}
        <div className="border rounded-lg p-4 space-y-2">
          <h3 className="font-semibold">Search</h3>
          <div className="flex items-center gap-4">
            <Search size={24} />
            <Search size={32} />
            <Search size={48} />
          </div>
          <div className="flex items-center gap-4">
            <Search size={24} className="text-blue-500" />
            <Search size={24} className="text-green-500" />
            <Search size={24} className="text-red-500" />
          </div>
        </div>

        {/* Quote Icon */}
        <div className="border rounded-lg p-4 space-y-2">
          <h3 className="font-semibold">Quote</h3>
          <div className="flex items-center gap-4">
            <Quote size={24} />
            <Quote size={32} />
            <Quote size={48} />
          </div>
          <div className="flex items-center gap-4">
            <Quote size={24} className="text-blue-500" />
            <Quote size={24} className="text-green-500" />
            <Quote size={24} className="text-red-500" />
          </div>
        </div>

        {/* Comment Icon */}
        <div className="border rounded-lg p-4 space-y-2">
          <h3 className="font-semibold">Comment</h3>
          <div className="flex items-center gap-4">
            <Comment size={24} />
            <Comment size={32} />
            <Comment size={48} />
          </div>
          <div className="flex items-center gap-4">
            <Comment size={24} className="text-blue-500" />
            <Comment size={24} className="text-green-500" />
            <Comment size={24} className="text-red-500" />
          </div>
        </div>

        {/* CheckBoxFilled Icon */}
        <div className="border rounded-lg p-4 space-y-2">
          <h3 className="font-semibold">CheckBoxFilled</h3>
          <div className="flex items-center gap-4">
            <CheckBoxFilled size={24} />
            <CheckBoxFilled size={32} />
            <CheckBoxFilled size={48} />
          </div>
          <div className="flex items-center gap-4">
            <CheckBoxFilled size={24} className="text-blue-500" />
            <CheckBoxFilled size={24} className="text-green-500" />
            <CheckBoxFilled size={24} className="text-red-500" />
          </div>
        </div>

        {/* Filter Icon */}
        <div className="border rounded-lg p-4 space-y-2">
          <h3 className="font-semibold">Filter</h3>
          <div className="flex items-center gap-4">
            <Filter size={24} />
            <Filter size={32} />
            <Filter size={48} />
          </div>
          <div className="flex items-center gap-4">
            <Filter size={24} className="text-blue-500" />
            <Filter size={24} className="text-green-500" />
            <Filter size={24} className="text-red-500" />
          </div>
        </div>

        {/* Group Icon */}
        <div className="border rounded-lg p-4 space-y-2">
          <h3 className="font-semibold">Group</h3>
          <div className="flex items-center gap-4">
            <Group size={24} />
            <Group size={32} />
            <Group size={48} />
          </div>
          <div className="flex items-center gap-4">
            <Group size={24} className="text-blue-500" />
            <Group size={24} className="text-green-500" />
            <Group size={24} className="text-red-500" />
          </div>
        </div>

        {/* Up Icon */}
        <div className="border rounded-lg p-4 space-y-2">
          <h3 className="font-semibold">Up</h3>
          <div className="flex items-center gap-4">
            <Up size={24} />
            <Up size={32} />
            <Up size={48} />
          </div>
          <div className="flex items-center gap-4">
            <Up size={24} className="text-blue-500" />
            <Up size={24} className="text-green-500" />
            <Up size={24} className="text-red-500" />
          </div>
        </div>

        {/* Down Icon */}
        <div className="border rounded-lg p-4 space-y-2">
          <h3 className="font-semibold">Down</h3>
          <div className="flex items-center gap-4">
            <Down size={24} />
            <Down size={32} />
            <Down size={48} />
          </div>
          <div className="flex items-center gap-4">
            <Down size={24} className="text-blue-500" />
            <Down size={24} className="text-green-500" />
            <Down size={24} className="text-red-500" />
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Usage Examples</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Basic Usage:</h3>
            <code className="block p-2 bg-background rounded text-sm">
              {`import { Filter } from '@/components/Icons';`}
              <br />
              {`<Filter size={24} />`}
            </code>
          </div>
          <div>
            <h3 className="font-medium mb-2">With Custom Styling:</h3>
            <code className="block p-2 bg-background rounded text-sm">
              {`<Filter size={32} className="text-blue-500" />`}
            </code>
          </div>
          <div>
            <h3 className="font-medium mb-2">With Custom Color:</h3>
            <code className="block p-2 bg-background rounded text-sm">
              {`<Filter size={24} color="#10B981" />`}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}

