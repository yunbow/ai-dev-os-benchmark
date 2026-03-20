"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { inviteMemberAction } from "@/features/teams/server/team-actions";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingButton } from "@/components/common/loading-button";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { InviteMemberSchema } from "@/features/teams/schema/team-schema";

interface InviteMemberFormProps {
  teamId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function InviteMemberForm({ teamId, onSuccess, onCancel }: InviteMemberFormProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof InviteMemberSchema>>({
    resolver: zodResolver(InviteMemberSchema),
    defaultValues: { teamId, email: "", role: "MEMBER" },
  });

  const onSubmit = async (data: z.infer<typeof InviteMemberSchema>) => {
    const result = await inviteMemberAction(data);
    if (result.success) {
      toast({ title: "Invitation sent", description: `Invitation sent to ${data.email}` });
      form.reset({ teamId, email: "", role: "MEMBER" });
      onSuccess();
    } else {
      toast({ title: "Error", description: result.error.message, variant: "destructive" });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="colleague@example.com" {...field} />
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
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="OWNER">Owner</SelectItem>
                  <SelectItem value="MEMBER">Member</SelectItem>
                  <SelectItem value="VIEWER">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <LoadingButton type="submit" loading={form.formState.isSubmitting}>Send Invite</LoadingButton>
        </div>
      </form>
    </Form>
  );
}
