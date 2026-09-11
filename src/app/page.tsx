import { Header } from '@/components/layout/header'
import { ProductDashboard } from '@/components/product-dashboard'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#07111f]">
      <Header />
      <ProductDashboard />
    </div>
  )
}
