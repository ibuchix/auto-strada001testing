
// Fix boolean to string conversion on line 56
<FormItem>
  <FormLabel>Service History Type</FormLabel>
  <Select 
    value={serviceHistoryType || ""} 
    onValueChange={(value) => handleServiceHistoryTypeChange(value)}
  >
    <SelectTrigger>
      <SelectValue placeholder="Select service history type" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="full">Full Service History</SelectItem>
      <SelectItem value="partial">Partial Service History</SelectItem>
      <SelectItem value="none">No Service History</SelectItem>
    </SelectContent>
  </Select>
  <FormMessage />
</FormItem>
