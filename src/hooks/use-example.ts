import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

// Example types - replace with your own
interface Item {
  id: string
  name: string
  description?: string
  createdAt: string
}

type CreateItemInput = Omit<Item, 'id' | 'createdAt'>
type UpdateItemInput = Partial<CreateItemInput>

// Query keys factory for type safety and consistency
export const itemKeys = {
  all: ['items'] as const,
  lists: () => [...itemKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...itemKeys.lists(), filters] as const,
  details: () => [...itemKeys.all, 'detail'] as const,
  detail: (id: string) => [...itemKeys.details(), id] as const,
}

// Fetch all items
export function useItems() {
  return useQuery({
    queryKey: itemKeys.lists(),
    queryFn: () => api.get<Item[]>('/items'),
  })
}

// Fetch single item
export function useItem(id: string) {
  return useQuery({
    queryKey: itemKeys.detail(id),
    queryFn: () => api.get<Item>(`/items/${id}`),
    enabled: !!id,
  })
}

// Create item
export function useCreateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateItemInput) => api.post<Item>('/items', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() })
    },
  })
}

// Update item
export function useUpdateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateItemInput }) =>
      api.patch<Item>(`/items/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: itemKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() })
    },
  })
}

// Delete item
export function useDeleteItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/items/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() })
    },
  })
}
