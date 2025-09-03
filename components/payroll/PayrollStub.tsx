import React from 'react';
import type { Employee } from '../../types';

interface PayrollStubProps {
  employee: Employee;
  payPeriod: string;
  payDate: string;
}

const StubRow: React.FC<{ label: string; current: number; ytd: number; isBold?: boolean }> = ({ label, current, ytd, isBold }) => (
  <tr className={isBold ? 'font-bold' : ''}>
    <td className="py-1 pr-4">{label}</td>
    <td className="py-1 pr-4 text-right">{current.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
    <td className="py-1 text-right">{ytd.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
  </tr>
);

export const PayrollStub: React.FC<PayrollStubProps> = ({ employee, payPeriod, payDate }) => {
  const annualSalary = employee.annualSalary;
  const monthlyGross = annualSalary / 12;

  // Simplified tax and deduction calculations
  const fedTax = monthlyGross * 0.15;
  const stateTax = monthlyGross * 0.05;
  const socialSecurity = monthlyGross * 0.062;
  const medicare = monthlyGross * 0.0145;
  const totalDeductions = fedTax + stateTax + socialSecurity + medicare;
  const netPay = monthlyGross - totalDeductions;
  
  // YTD calculations (assuming September is the 9th month)
  const monthMultiplier = 9;
  const ytdGross = monthlyGross * monthMultiplier;
  const ytdFedTax = fedTax * monthMultiplier;
  const ytdStateTax = stateTax * monthMultiplier;
  const ytdSocialSecurity = socialSecurity * monthMultiplier;
  const ytdMedicare = medicare * monthMultiplier;
  const ytdDeductions = totalDeductions * monthMultiplier;
  const ytdNetPay = netPay * monthMultiplier;

  return (
    <div id="payroll-stub" className="bg-white text-gray-800 p-8 rounded-lg font-sans text-sm">
      <header className="flex justify-between items-center pb-4 border-b-2 border-gray-300">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SOVR Development Holdings LLC</h1>
          <p>123 Sovereign Way, Genesis Block, 1337</p>
        </div>
        <h2 className="text-xl font-semibold">Pay Statement</h2>
      </header>

      <section className="grid grid-cols-2 gap-8 my-6 text-xs">
        <div>
          <p className="font-bold">{employee.name}</p>
          <p>Address on File</p>
        </div>
        <table className="w-full">
          <tbody>
            <tr><td className="font-bold pr-2">Pay Period:</td><td>{payPeriod}</td></tr>
            <tr><td className="font-bold pr-2">Pay Date:</td><td>{payDate}</td></tr>
            <tr><td className="font-bold pr-2">Employee ID:</td><td>{employee.id}</td></tr>
          </tbody>
        </table>
      </section>

      <section className="grid grid-cols-2 gap-12">
        <div>
          <h3 className="text-lg font-semibold border-b border-gray-300 pb-1 mb-2">Earnings</h3>
          <table className="w-full">
            <thead>
              <tr className="text-left font-bold text-xs">
                <th className="py-1">Description</th>
                <th className="py-1 text-right">Current</th>
                <th className="py-1 text-right">YTD</th>
              </tr>
            </thead>
            <tbody>
              <StubRow label="Regular Pay" current={monthlyGross} ytd={ytdGross} />
              <StubRow label="Gross Earnings" current={monthlyGross} ytd={ytdGross} isBold={true} />
            </tbody>
          </table>
        </div>
        <div>
          <h3 className="text-lg font-semibold border-b border-gray-300 pb-1 mb-2">Deductions</h3>
          <table className="w-full">
            <thead>
              <tr className="text-left font-bold text-xs">
                <th className="py-1">Description</th>
                <th className="py-1 text-right">Current</th>
                <th className="py-1 text-right">YTD</th>
              </tr>
            </thead>
            <tbody>
              <StubRow label="Federal Tax" current={fedTax} ytd={ytdFedTax} />
              <StubRow label="State Tax" current={stateTax} ytd={ytdStateTax} />
              <StubRow label="Social Security" current={socialSecurity} ytd={ytdSocialSecurity} />
              <StubRow label="Medicare" current={medicare} ytd={ytdMedicare} />
              <StubRow label="Total Deductions" current={totalDeductions} ytd={ytdDeductions} isBold={true} />
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 pt-4 border-t-2 border-gray-300">
        <div className="flex justify-end">
          <div className="w-1/2">
            <h3 className="text-lg font-semibold border-b border-gray-300 pb-1 mb-2">Summary</h3>
            <table className="w-full">
                <tbody>
                  <tr>
                    <td className="py-1 font-bold">Gross Earnings</td>
                    <td className="py-1 text-right">{monthlyGross.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-bold">Total Deductions</td>
                    <td className="py-1 text-right">- {totalDeductions.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
                  </tr>
                  <tr className="font-bold text-lg border-t-2 border-gray-300">
                    <td className="pt-2">Net Pay</td>
                    <td className="pt-2 text-right">{netPay.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
                  </tr>
                </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};