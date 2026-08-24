"use client"

import { useState } from "react"

const formatDate = (d) => {
  if (!d) return "N/A"
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
}

// A ₹amount that shows a structured breakdown popover on hover.
function HoverAmount({ label, amount, valueClassName, popupWidthClassName, children }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative flex items-center justify-between gap-2" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span className="text-[11px] text-gray-500">{label}</span>
      <span className={`cursor-help border-b border-dotted border-gray-400 text-xs font-medium ${valueClassName || ""}`}>
        ₹{(Number(amount) || 0).toFixed(2)}
      </span>
      {show && children && (
        <div className={`absolute z-50 top-full right-0 mt-1 ${popupWidthClassName || "w-64"} bg-white border border-gray-200 rounded-md shadow-lg p-3 text-xs text-left`}>
          {children}
        </div>
      )}
    </div>
  )
}

function PoAmountTooltip({ basicAmount, poAmount }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between gap-3"><span className="text-gray-500">Basic Amount:</span><span className="font-medium">₹{(Number(basicAmount) || 0).toFixed(2)}</span></div>
      <div className="flex justify-between gap-3"><span className="text-gray-500">Total Amount:</span><span className="font-medium">₹{(Number(poAmount) || 0).toFixed(2)}</span></div>
    </div>
  )
}

function PaidAmountTooltip({ breakdown }) {
  if (!breakdown || breakdown.length === 0) {
    return <p className="text-gray-400">No PI/GRN uploaded yet</p>
  }
  return (
    <div className="max-h-56 overflow-y-auto overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="text-gray-500">
            <th className="text-left font-medium pb-1 pr-2 whitespace-nowrap">PI/GRN No.</th>
            <th className="text-left font-medium pb-1 pr-2 whitespace-nowrap">Payment Requested</th>
            <th className="text-left font-medium pb-1 pr-2 whitespace-nowrap">Payment Paid</th>
            <th className="text-left font-medium pb-1 whitespace-nowrap">Payment Advice</th>
          </tr>
        </thead>
        <tbody>
          {breakdown.map((e, i) => (
            <tr key={i} className="border-t border-gray-100 align-top">
              <td className="py-1.5 pr-2 whitespace-nowrap">
                <span className="text-[10px] text-gray-500 block">{e.type}</span>
                <span className="font-medium text-gray-800">{e.number || "N/A"}</span>
              </td>
              <td className="py-1.5 pr-2 whitespace-nowrap">
                <span className="font-medium text-gray-700 block">₹{(Number(e.requestedAmount) || 0).toFixed(2)}</span>
                <span className="text-[10px] text-gray-400">{formatDate(e.expectedPaymentDate)}</span>
              </td>
              <td className="py-1.5 pr-2 whitespace-nowrap">
                {e.paymentStatus === "PAID" ? (
                  <>
                    <span className="font-medium text-green-700 block">₹{(Number(e.paidAmount) || 0).toFixed(2)}</span>
                    <span className="text-[10px] text-gray-400">{formatDate(e.paymentDoneDate)}</span>
                  </>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className="py-1.5 whitespace-nowrap">
                {e.paymentReceiptUrl ? (
                  <a href={e.paymentReceiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                    View
                  </a>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// "Payment Status" column — PO Amount / Paid Amount / Balance stacked, PO Amount and
// Paid Amount each show a breakdown popover on hover.
export function PaymentStatusCell({ poBasicAmount, poAmount, paidAmount, breakdown }) {
  const balance = (Number(poAmount) || 0) - (Number(paidAmount) || 0)
  return (
    <div className="w-40 space-y-1">
      <HoverAmount label="PO Amount:" amount={poAmount}>
        <PoAmountTooltip basicAmount={poBasicAmount} poAmount={poAmount} />
      </HoverAmount>
      <HoverAmount label="Paid Amount:" amount={paidAmount} valueClassName="text-green-700" popupWidthClassName="w-[28rem]">
        <PaidAmountTooltip breakdown={breakdown} />
      </HoverAmount>
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100">
        <span className="text-[11px] text-gray-500">Balance:</span>
        <span className={`text-xs font-semibold ${balance > 0 ? "text-red-600" : "text-gray-700"}`}>₹{balance.toFixed(2)}</span>
      </div>
    </div>
  )
}
