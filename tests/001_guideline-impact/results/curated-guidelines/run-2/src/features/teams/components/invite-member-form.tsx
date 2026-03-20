"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { InviteMemberSchema, InviteMemberInput } from "../schema/team-schema";
import { inviteMember } from "../server/team-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "@/components/common/loading-spinner";

interface InviteMemberFormProps {
  teamId: string;
  onSuccess?: () => void;
}

export function InviteMemberForm({ teamId, onSuccess }: InviteMemberFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<InviteMemberInput>({
    resolver: zodResolver(InviteMemberSchema),
    defaultValues: { email: "", role: "MEMBER" },
  });

  const onSubmit = async (data: InviteMemberInput) => {
    setIsLoading(true);

    const result = await inviteMember(teamId, data);

    if (!result.success) {
      toast({ title: "Error", description: result.error.message, variant: "destructive" });
      setIsLoading(false);
      return;
    }

    toast({ title: "Success", description: result.data.message });
    form.reset();
    router.refresh();
    onSuccess?.();
    setIsLoading(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="colleague@example.com" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="MEMBER">Member</SelectItem>
                  <SelectItem value="VIEWER">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
          Send Invitation
        </Button>
      </form>
    </Form>
  );
}
