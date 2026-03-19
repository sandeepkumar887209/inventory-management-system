import React, { useEffect, useState } from "react";
import api from "../../services/axios";

import {
  Laptop,
  Calendar,
  ShoppingCart,
  DollarSign,
  Users,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Activity,
  Cpu,
  Boxes,
  Brain
} from "lucide-react";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend
} from "recharts";

import { Badge } from "../common/Badge";

export function Dashboard() {

  const [loading,setLoading]=useState(true)

  const [stats,setStats]=useState<any>({})
  const [revenue,setRevenue]=useState<any[]>([])
  const [brands,setBrands]=useState<any[]>([])
  const [statusData,setStatusData]=useState<any[]>([])
  const [alerts,setAlerts]=useState<any[]>([])
  const [activity,setActivity]=useState<any[]>([])
  const [predictions,setPredictions]=useState<any>({})

  useEffect(()=>{
    loadDashboard()
  },[])

  const loadDashboard = async () => {

    try{

      const [
        laptopsRes,
        salesRes,
        rentalsRes,
        customersRes
      ] = await Promise.all([
        api.get("/inventory/laptops/"),
        api.get("/sales/sale/"),
        api.get("/rentals/rental/"),
        api.get("/customers/customers/")
      ])

      const laptops = laptopsRes.data.results || laptopsRes.data
      const sales = salesRes.data.results || salesRes.data
      const rentals = rentalsRes.data.results || rentalsRes.data
      const customers = customersRes.data.results || customersRes.data

      /* =========================
         BASIC STATS
      ========================= */

      const total = laptops.length
      const available = laptops.filter((l:any)=>l.status==="AVAILABLE").length
      const rented = laptops.filter((l:any)=>l.status==="RENTED").length
      const sold = laptops.filter((l:any)=>l.status==="SOLD").length

      const salesRevenue = sales.reduce((s:number,a:any)=>s+Number(a.total_amount||0),0)
      const rentalRevenue = rentals.reduce((s:number,a:any)=>s+Number(a.total_rent||0),0)

      const profit = salesRevenue*0.25 + rentalRevenue*0.40

      setStats({
        total,
        available,
        rented,
        sold,
        customers:customers.length,
        salesRevenue,
        rentalRevenue,
        profit
      })

      /* =========================
         STATUS DISTRIBUTION
      ========================= */

      setStatusData([
        {name:"Available",value:available},
        {name:"Rented",value:rented},
        {name:"Sold",value:sold}
      ])

      /* =========================
         BRAND ANALYTICS
      ========================= */

      const brandMap:any = {}

      laptops.forEach((l:any)=>{
        if(!brandMap[l.brand]){
          brandMap[l.brand]=0
        }
        brandMap[l.brand]+=1
      })

      const brandData = Object.keys(brandMap).map(b=>({
        brand:b,
        count:brandMap[b]
      }))

      setBrands(brandData)

      /* =========================
         MONTHLY REVENUE
      ========================= */

      const monthMap:any={}

      sales.forEach((s:any)=>{
        const m=new Date(s.created_at)
        const key=m.toLocaleString("default",{month:"short"})
        if(!monthMap[key]) monthMap[key]={month:key,sales:0,rentals:0}
        monthMap[key].sales+=Number(s.total_amount||0)
      })

      rentals.forEach((r:any)=>{
        const m=new Date(r.created_at)
        const key=m.toLocaleString("default",{month:"short"})
        if(!monthMap[key]) monthMap[key]={month:key,sales:0,rentals:0}
        monthMap[key].rentals+=Number(r.total_rent||0)
      })

      setRevenue(Object.values(monthMap))

      /* =========================
         RENTAL ALERTS
      ========================= */

      const rentalAlerts:any[]=[]

      rentals.forEach((r:any)=>{
        if(!r.end_date) return
        const diff=Math.ceil((new Date(r.end_date).getTime()-Date.now())/(1000*3600*24))
        if(diff<=5){
          rentalAlerts.push({
            customer:r.customer_detail?.name,
            days:diff
          })
        }
      })

      setAlerts(rentalAlerts)

      /* =========================
         RECENT ACTIVITY
      ========================= */

      const act:any[]=[]

      sales.slice(0,5).forEach((s:any)=>{
        act.push({
          text:`Laptop sold to ${s.customer_detail?.name}`,
          value:s.total_amount,
          type:"sale"
        })
      })

      rentals.slice(0,5).forEach((r:any)=>{
        act.push({
          text:`Rental created for ${r.customer_detail?.name}`,
          value:r.total_rent,
          type:"rental"
        })
      })

      setActivity(act)

      /* =========================
         AI PREDICTIONS
      ========================= */

      const avgSales = salesRevenue/12
      const avgRent = rentalRevenue/12

      setPredictions({
        nextMonthSales:Math.round(avgSales*1.15),
        nextMonthRentals:Math.round(avgRent*1.20),
        inventoryDemand:rented>available?"High":"Normal"
      })

      setLoading(false)

    }catch(e){
      console.log(e)
    }

  }

  if(loading){
    return <div className="p-10">Loading Dashboard...</div>
  }

  return(

    <div className="space-y-6">

      {/* HEADER */}

      <div>
        <h1 className="text-2xl font-bold">AI Business Dashboard</h1>
        <p className="text-neutral-600">ERP analytics for laptop rental business</p>
      </div>

      {/* KPI GRID */}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

        <StatCard icon={Laptop} title="Total Inventory" value={stats.total}/>
        <StatCard icon={Calendar} title="Active Rentals" value={stats.rented}/>
        <StatCard icon={ShoppingCart} title="Sales Revenue" value={`₹${stats.salesRevenue}`}/>
        <StatCard icon={DollarSign} title="Profit" value={`₹${Math.round(stats.profit)}`}/>
        <StatCard icon={Users} title="Customers" value={stats.customers}/>
        <StatCard icon={Boxes} title="Available Laptops" value={stats.available}/>
        <StatCard icon={Activity} title="Sold Laptops" value={stats.sold}/>
        <StatCard icon={Cpu} title="Rental Revenue" value={`₹${stats.rentalRevenue}`}/>

      </div>

      {/* CHARTS */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Revenue */}

        <div className="bg-white p-6 rounded-xl shadow border">

          <h3 className="font-semibold mb-4">Revenue Trend</h3>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenue}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="month"/>
              <YAxis/>
              <Tooltip/>
              <Legend/>
              <Line type="monotone" dataKey="sales" stroke="#7c3aed"/>
              <Line type="monotone" dataKey="rentals" stroke="#3b82f6"/>
            </LineChart>
          </ResponsiveContainer>

        </div>

        {/* Inventory Status */}

        <div className="bg-white p-6 rounded-xl shadow border">

          <h3 className="font-semibold mb-4">Inventory Status</h3>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
              >
                <Cell fill="#3b82f6"/>
                <Cell fill="#10b981"/>
                <Cell fill="#8b5cf6"/>
              </Pie>
              <Tooltip/>
            </PieChart>
          </ResponsiveContainer>

        </div>

      </div>

      {/* BRAND ANALYTICS */}

      <div className="bg-white p-6 rounded-xl shadow border">

        <h3 className="font-semibold mb-4">Brand Distribution</h3>

        <ResponsiveContainer width="100%" height={300}>

          <BarChart data={brands}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="brand"/>
            <YAxis/>
            <Tooltip/>
            <Bar dataKey="count" fill="#2563eb"/>
          </BarChart>

        </ResponsiveContainer>

      </div>

      {/* ALERTS + ACTIVITY */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="bg-white p-6 rounded-xl shadow border">

          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="text-orange-500"/>
            <h3 className="font-semibold">Rental Alerts</h3>
          </div>

          {alerts.length===0 && <p>No alerts</p>}

          {alerts.map((a,i)=>(
            <div key={i} className="flex justify-between border-b py-2">
              <span>{a.customer}</span>
              <Badge variant="danger">{a.days} days</Badge>
            </div>
          ))}

        </div>

        <div className="bg-white p-6 rounded-xl shadow border">

          <h3 className="font-semibold mb-4">Recent Activity</h3>

          {activity.map((a,i)=>(
            <div key={i} className="flex justify-between border-b py-2">
              <span>{a.text}</span>
              <Badge variant="success">₹{a.value}</Badge>
            </div>
          ))}

        </div>

      </div>

      {/* AI PREDICTIONS */}

      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-xl">

        <div className="flex items-center gap-2 mb-4">
          <Brain/>
          <h3 className="font-semibold">AI Business Insights</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <InsightCard
            title="Next Month Sales Forecast"
            value={`₹${predictions.nextMonthSales}`}
          />

          <InsightCard
            title="Next Month Rental Forecast"
            value={`₹${predictions.nextMonthRentals}`}
          />

          <InsightCard
            title="Inventory Demand"
            value={predictions.inventoryDemand}
          />

        </div>

      </div>

    </div>

  )

}

/* =======================
   STAT CARD
======================= */

function StatCard({icon:Icon,title,value}:any){

  return(
    <div className="bg-white p-6 rounded-xl shadow border flex justify-between">

      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <h2 className="text-2xl font-bold">{value}</h2>
      </div>

      <Icon className="w-8 h-8 text-blue-600"/>

    </div>
  )

}

/* =======================
   AI INSIGHT CARD
======================= */

function InsightCard({title,value}:any){

  return(

    <div className="bg-white bg-opacity-20 p-4 rounded-lg">

      <p className="text-sm opacity-80">{title}</p>

      <h3 className="text-xl font-bold">
        {value}
      </h3>

    </div>

  )

}