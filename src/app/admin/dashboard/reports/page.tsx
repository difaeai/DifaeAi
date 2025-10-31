
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
// import { generateSecurityReport } from "@/ai/flows/automated-security-reporting";

const pastReports: { date: string; alerts: number; summary: string }[] = [];

export default function ReportsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateReport = async () => {
    setIsLoading(true);
    toast({
      title: "Generating Report...",
      description: "This may take a moment. Please wait.",
    });

    try {
      // Mock data for the AI flow
      const mockInput = {
        date: new Date().toISOString().split("T")[0],
        events: [
          {
            timestamp: new Date().toISOString(),
            alertType: "Suspicious Movement",
            screenshotDataUri: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", // 1x1 black pixel
            details: "Movement detected near the garage at 3:15 AM.",
          },
        ],
      };
      
      // The following line is commented out as it would call a real AI flow.
      // const result = await generateSecurityReport(mockInput);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      // const pdfData = result.report; // This would be the base64 PDF string.
      
      toast({
        title: "Report Generated Successfully!",
        description: "Your new security report is ready for download.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error Generating Report",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Security Reports</h1>
        <Button onClick={handleGenerateReport} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileText className="mr-2 h-4 w-4" />
          )}
          Generate Today's Report
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Past Reports</CardTitle>
          <CardDescription>
            Download and review previously generated security reports.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Alerts</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pastReports.length > 0 ? (
                pastReports.map((report) => (
                  <TableRow key={report.date}>
                    <TableCell className="font-medium">{report.date}</TableCell>
                    <TableCell>{report.alerts}</TableCell>
                    <TableCell>{report.summary}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No past reports found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
