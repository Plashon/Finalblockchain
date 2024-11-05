import React from 'react'

export const test = () => {
  return (
    
    <div className="App">
      <h1>เหรียญของคุณ</h1>
      {isConnected ? (
        <>
          <p><strong>ชื่อเหรียญ:</strong> {tokenName}</p>
          <p><strong>จำนวนเหรียญในสัญญา:</strong> {formatBalance(contractBalance)}</p>
          <p><strong>จำนวนเหรียญในบัญชี:</strong> {formatBalance(userBalance)}</p>
          <p><strong>เวลาที่เหลือจนสามารถขอเหรียญได้อีกครั้ง:</strong> {formatRemainingTime(remainingTime)}</p>
          <p><strong>บัญชีที่เชื่อมต่อ:</strong> {account}</p>
          <button onClick={handleRequestTokens}>ขอเหรียญ</button>
        </>
      ) : (
        <button onClick={connectToMetaMask}>เชื่อมต่อกับ MetaMask</button>
      )}
    </div>
  )
}
