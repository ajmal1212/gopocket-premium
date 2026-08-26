import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Sparkles, CheckCircle2 } from "lucide-react";

export function ShadcnDemo() {
  const [enabled, setEnabled] = useState(true);
  const [name, setName] = useState("");

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-8 my-8 font-sans">
      <Card className="border-purple-200 dark:border-purple-900 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="default" className="bg-purple-600 hover:bg-purple-700">
              <Sparkles className="w-3 h-3 mr-1" /> Ready for Use
            </Badge>
            <div className="flex items-center space-x-2">
              <Label htmlFor="demo-mode">Interactive Mode</Label>
              <Switch id="demo-mode" checked={enabled} onCheckedChange={setEnabled} />
            </div>
          </div>
          <CardTitle className="text-2xl mt-3 font-bold text-gray-900">
            shadcn/ui + Radix Primitives in Astro
          </CardTitle>
          <CardDescription>
            All React & Radix UI primitives are configured and integrated into your Astro workspace.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="components" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="components">UI Controls</TabsTrigger>
              <TabsTrigger value="accordion">Accordion Demo</TabsTrigger>
            </TabsList>

            <TabsContent value="components" className="space-y-4 pt-4">
              <div className="grid gap-2">
                <Label htmlFor="user-name">Test Input</Label>
                <Input
                  id="user-name"
                  placeholder="Type something here..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {name && (
                <p className="text-sm text-purple-700 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Hello, <strong>{name}</strong>!
                </p>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                <Button variant="default">Primary Button</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
            </TabsContent>

            <TabsContent value="accordion" className="pt-4">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Is Radix UI accessible?</AccordionTrigger>
                  <AccordionContent>
                    Yes. Radix UI primitives adhere to WAI-ARIA design patterns, supporting keyboard navigation and screen readers automatically.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>How do I add more shadcn components?</AccordionTrigger>
                  <AccordionContent>
                    Simply create new files under <code>src/components/ui/</code> or install additional Radix UI packages as needed.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex justify-between border-t pt-4">
          <span className="text-xs text-gray-500">React Client Component</span>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="default" className="bg-purple-600 hover:bg-purple-700">Open Modal</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Radix UI Modal Dialog</DialogTitle>
                <DialogDescription>
                  This modal is powered by <code>@radix-ui/react-dialog</code> inside an Astro page with <code>client:load</code>.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-gray-600">Fully accessible, smooth transitions, and easy to customize.</p>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Close</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>
    </div>
  );
}
