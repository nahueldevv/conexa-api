import { z } from 'zod'

export const transporterSchema = z.object({
  company_name: z.string().optional(),
  cuit: z.string().min(11, 'CUIT inválido').max(13),
  truck_type: z.string().min(2, 'Tipo de camión requerido'),
  capacity_tons: z.number().positive('La capacidad debe ser mayor a 0'),
  license_plate: z.string().min(6, 'Patente inválida')
})

export const companySchema = z.object({
  company_name: z.string().min(2, 'Nombre de empresa requerido'),
  cuit: z.string().min(11, 'CUIT inválido').max(13),
  industry: z.string().optional()
})