
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function PostSkeleton() {
    return (
        <Card className="w-full mb-4">
            <CardHeader className="pb-2">
                <div className="flex flex-row items-center gap-2">
                    <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
                    <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
                    <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
                </div>
                <div className="flex flex-row items-center mt-2 gap-2">
                    <div className="h-6 w-8 bg-gray-200 rounded animate-pulse" />
                    <span>/</span>
                    <div className="h-6 w-8 bg-gray-200 rounded animate-pulse" />
                </div>
            </CardHeader>
            <div className="px-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse" />
                <div className="flex flex-col gap-2">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
            </div>
            <CardContent>
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
            </CardContent>
        </Card>
    );
}
