import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md mx-4 border-destructive/20 bg-card">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <h1 className="text-2xl font-display font-bold text-foreground">Realm Not Found</h1>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            The path you are looking for has been lost to the void.
          </p>
          
          <div className="mt-8">
             <Link href="/" className="text-primary hover:underline font-mono text-sm">
               Return to Cultivation
             </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
