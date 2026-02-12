import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTemplates } from '@/hooks/use-templates'

interface TemplateSelectorProps {
  sourceId?: string
  selectedTemplateId: string
  onTemplateChange: (templateId: string) => void
}

export function TemplateSelector({ sourceId, selectedTemplateId, onTemplateChange }: TemplateSelectorProps) {
  const { templates, isLoading } = useTemplates(sourceId)

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">Loading templates...</div>
    )
  }

  return (
    <Select value={selectedTemplateId || 'blank'} onValueChange={onTemplateChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select Template" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="blank">Blank note</SelectItem>
        {templates.map((template) => (
          <SelectItem key={template.id} value={template.id}>
            {template.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
