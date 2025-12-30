import { SubHeader } from '@/components/SubHeader';

export default function SubHeaderTestPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">SubHeader Component Test</h1>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">Basic Usage</h2>
          <div className="bg-white p-4 rounded-lg border">
            <SubHeader headerName="Test Header" />
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Long Header Name</h2>
          <div className="bg-white p-4 rounded-lg border">
            <SubHeader headerName="This is a very long header name that should wrap properly on mobile devices" />
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">With showFilterIconButton (default true)</h2>
          <div className="bg-white p-4 rounded-lg border">
            <SubHeader headerName="Header with Filter" showFilterIconButton={true} />
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Without Filter Icon Button</h2>
          <div className="bg-white p-4 rounded-lg border">
            <SubHeader headerName="Header without Filter" showFilterIconButton={false} />
          </div>
        </section>
      </div>
    </div>
  );
}

