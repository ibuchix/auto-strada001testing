
/**
 * Vehicle Status Section
 * Updated: 2025-05-04 - Updated to handle finance state properly
 * 
 * Section for collecting vehicle status information including damage, registration,
 * private plate, and outstanding finance status.
 */

import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { FormSection } from "../FormSection";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useFormData } from "../context/FormDataContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/errors/FieldError";
import { ServiceHistoryLabels, ServiceHistoryType } from "@/types/forms";
import { Value } from "@radix-ui/react-select";
import { Input } from "@/components/ui/input";
import { Controller } from "react-hook-form";
import { ChangeEvent } from "react";

export const VehicleStatusSection = () => {
  const { form } = useFormData();
  console.log(form)
  return (
    <FormSection title="Vehicle Status">
      <CardHeader>
        <CardTitle>Vehicle Status</CardTitle>
        <CardDescription>
          Information about the current status of your vehicle
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 gap-y-6">
          {/* Is the vehicle damaged? */}
          <FormField
            control={form.control}
            name="isDamaged"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Is your vehicle damaged?
                  </FormLabel>
                  <FormDescription>
                    Check this if your vehicle has any significant damage
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {/* Is the vehicle registered in Poland? */}
          <FormField
            control={form.control}
            name="isRegisteredInPoland"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Is your vehicle registered in Poland?
                  </FormLabel>
                  <FormDescription>
                    Check this if your vehicle has Polish registration
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {/* Does the vehicle have a private plate? */}
          <FormField
            control={form.control}
            name="hasPrivatePlate"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Does your vehicle have a private plate?
                  </FormLabel>
                  <FormDescription>
                    Check this if your vehicle has a personalized license plate
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {/* Does the vehicle have outstanding finance? */}
          <FormField
            control={form.control}
            name="hasOutstandingFinance"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      if (!checked) {
                        form.setValue("financeAmount", null);
                        form.setValue("financeProvider", "");
                      }
                    }}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Does your vehicle have outstanding finance?
                  </FormLabel>
                  <FormDescription>
                    Check this if your vehicle has a loan or finance agreement outstanding
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {/* Does the vehicle have service history? */}
          <FormField
            control={form.control}
            name="hasServiceHistory"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Does your vehicle have service history?
                  </FormLabel>
                  <FormDescription>
                    Check this if you have service records for your vehicle
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          {/* vehicle service history detail */}
          <div>
            <Label htmlFor="serviceHistoryType">Service history</Label>
            <Select
              onValueChange={(value: ServiceHistoryType) => form.setValue("serviceHistoryType", value)}
              defaultValue={form.watch("serviceHistoryType")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select service history type" />
              </SelectTrigger>
              <SelectContent>
                {
                  Object.entries(ServiceHistoryLabels).map(([value, label]) => (<SelectItem value={value}>{label}</SelectItem>))
                }
              </SelectContent>
            </Select>
            <FieldError message={form.formState.errors.serviceHistoryType?.message ? String(form.formState.errors.serviceHistoryType?.message) : undefined} />
          </div>

          {/* Service history's file upload if service history is full or partial*/}
          {
            (form.getValues('serviceHistoryType') === 'full' || form.getValues('serviceHistoryType') === 'partial') && (
              <Controller
                name="serviceHistoryFiles"
                control={form.control}
                rules={{
                  required: {
                    value: true,
                    message: "Service history document is required",
                  },
                }}
                render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <div>
                        <FormLabel htmlFor="serviceHistoryFiles">
                          Service history file
                        </FormLabel>

                        <Input
                          id="serviceHistoryFiles"
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            const file = e.target.files?.[0];
                            const maxFileSize = 10 * 1024 * 1024; // 10MB
                            const allowedTypes = [
                              "application/pdf",
                              "application/msword", // .doc
                              "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
                            ];

                            if (!file) {
                              onChange(null);
                              return;
                            }

                            if (!allowedTypes.includes(file.type)) {
                              form.setError("serviceHistoryFiles", {
                                type: "manual",
                                message: "File must be a document (PDF, DOC, DOCX)",
                              });
                              return;
                            }

                            if (file.size > maxFileSize) {
                              form.setError("serviceHistoryFiles", {
                                type: "manual",
                                message: "File must be less than 10MB",
                              });
                              return;
                            }

                            // Clear any previous error
                            form.clearErrors("serviceHistoryFiles");

                            // File is valid
                            onChange(file);
                          }}
                          {...rest}
                        />

                        <FieldError
                          message={
                            form.formState.errors.serviceHistoryFiles?.message
                          }
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            )
          }
        </div>
      </CardContent>
    </FormSection>
  );
};
