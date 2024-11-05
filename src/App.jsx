import React, { useState, useEffect } from "react";
import Web3 from "web3";
import contractABI from "./contractABI.json";
import Swal from "sweetalert2";

const contractAddress = "0x075c6bd8139A6ae7E67E676219DD4907F7498844";

function App() {
  const [tokenName, setTokenName] = useState("");
  const [contractBalance, setContractBalance] = useState(0);
  const [userBalance, setUserBalance] = useState(0);
  const [account, setAccount] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [requestCooldown, setRequestCooldown] = useState(0);
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);

  useEffect(() => {
    const storedAccount = localStorage.getItem("account");
    if (storedAccount) {
      setAccount(storedAccount);
      setIsConnected(true);
    }
    if (isConnected) {
      fetchContractData();
    }
  }, [isConnected]);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingTime((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [remainingTime]);

  const connectToMetaMask = async () => {
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);
      try {
        // Request account access
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const accounts = await web3.eth.getAccounts();

        // Set account state and local storage
        setAccount(accounts[0]);
        localStorage.setItem("account", accounts[0]);
        setIsConnected(true);

        // Show success message
        Swal.fire({
          title: "เชื่อมต่อสำเร็จ!",
          text: "คุณเชื่อมต่อกับ MetaMask แล้ว!",
          icon: "success",
          confirmButtonText: "ตกลง",
        });
      } catch (error) {
        console.error("Error connecting to MetaMask:", error);
        Swal.fire({
          title: "ข้อผิดพลาด!",
          text: "ไม่สามารถเชื่อมต่อกับ MetaMask ได้. กรุณาลองอีกครั้ง.",
          icon: "error",
          confirmButtonText: "ตกลง",
        });
      }
    } else {
      Swal.fire({
        title: "ไม่พบ MetaMask!",
        text: "กรุณาติดตั้ง MetaMask เพื่อใช้แอปพลิเคชันนี้!",
        icon: "warning",
        confirmButtonText: "ตกลง",
      });
    }
  };

  const disconnect = async () => {
    const { isConfirmed } = await Swal.fire({
      title: "คุณแน่ใจหรือไม่?",
      text: "ต้องการออกจากระบบ?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ใช่",
      cancelButtonText: "ยกเลิก",
    });

    if (isConfirmed) {
      localStorage.removeItem("account");
      setAccount("");
      setIsConnected(false);

      // Optionally, you could show a message that the user has been disconnected
      Swal.fire({
        title: "สำเร็จ!",
        text: "คุณได้ออกจากระบบแล้ว!",
        icon: "success",
        confirmButtonText: "ตกลง",
      });
    }
  };

  const fetchContractData = async () => {
    const web3 = new Web3(window.ethereum);
    const contract = new web3.eth.Contract(contractABI, contractAddress);

    const name = await contract.methods.name().call();
    setTokenName(name);

    const balance = await contract.methods.getContractBalance().call();
    setContractBalance(balance);

    const userBalance = await contract.methods.balanceOf(account).call();
    setUserBalance(userBalance);

    const cooldown = await contract.methods.requestCooldown().call();
    const lastRequest = await contract.methods.lastRequestTime(account).call();

    const requestCooldown = Number(cooldown);
    const lastRequestTime = Number(lastRequest);

    const currentTime = Math.floor(Date.now() / 1000);
    const elapsedTime = currentTime - lastRequestTime;
    const remainingTimeInSeconds =
      requestCooldown > elapsedTime ? requestCooldown - elapsedTime : 0;

    setRequestCooldown(requestCooldown);
    setLastRequestTime(lastRequestTime);
    setRemainingTime(remainingTimeInSeconds);
  };

  const formatBalance = (balance) => {
    return (BigInt(balance) / BigInt(10 ** 18)).toString();
  };

  const formatRemainingTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} นาที ${remainingSeconds} วินาที`;
  };

  const handleRequestTokens = async () => {
    const web3 = new Web3(window.ethereum);
    const contract = new web3.eth.Contract(contractABI, contractAddress);

    // Show loading spinner
    const loadingAlert = Swal.fire({
      title: "กำลังดำเนินการ...",
      text: "กรุณารอขณะกำลังขอเหรียญ",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      await contract.methods.requestTokens().send({ from: account });
      // Close the loading alert
      loadingAlert.close();
      // Show success message
      Swal.fire({
        icon: "success",
        title: "สำเร็จ!",
        text: "การขอเหรียญสำเร็จ!",
        confirmButtonText: "ตกลง",
      });

      fetchContractData();
    } catch (error) {
      console.error("เกิดข้อผิดพลาดระหว่างการขอเหรียญ:", error);

      // Close the loading alert
      loadingAlert.close();

      // Show error message
      Swal.fire({
        icon: "error",
        title: "ล้มเหลว!",
        text: "การขอเหรียญล้มเหลว!",
        confirmButtonText: "ตกลง",
      });
    }
  };

  return (
    <div>
      <div className="navbar bg-gray-200 shadow-lg w-full">
        <div className="flex-1">
          <a className="btn btn-ghost text-xl">daisyUI</a>
        </div>
        <div className="flex-none">
          {isConnected ? (
            <button className="btn btn-active" onClick={disconnect}>
              Connected
            </button>
          ) : (
            <button className="btn btn-primary" onClick={connectToMetaMask}>
              Connect Wallet
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center justify-center h-auto mt-20 mb-10">
        {/* Left Container for Contract Info */}
        <div className="w-full max-w-sm p-4 bg-white rounded shadow-md mr-5">
          <h2 className="text-lg font-semibold text-gray-800">
            <strong>ชื่อ : {tokenName}</strong>
          </h2>
          <p className="text-sm text-gray-600">ชื่อย่อ : BCP </p>
          <p className="text-sm text-gray-600">
            ที่อยู่ของสัญญา : {contractAddress}
          </p>
        </div>

        {/* Existing Form */}
        <form className="w-full max-w-sm p-6 bg-white rounded shadow-md">
          <h2 className="mb-6 text-2xl font-semibold text-center text-gray-800">
            <p>
              <strong>{tokenName}</strong>
            </p>
          </h2>
          <div className="mb-4">
            <label
              className="block mb-1 text-sm font-medium text-black"
              htmlFor="input1"
            >
              <p>จำนวนเหรียญที่เหลือ</p>
            </label>
            <div className="w-full p-2 border border-gray-300 rounded text-black">
              {formatBalance(contractBalance)}
            </div>
          </div>
          {isConnected ? (
            <>
              <div className="mb-6">
                <label
                  className="block mb-1 text-sm font-medium text-black"
                  htmlFor="input1"
                >
                  <p>จำนวนเหรียญในบัญชี</p>
                </label>
                <div className="w-full p-2 border border-gray-300 rounded text-black">
                  {formatBalance(userBalance)}
                </div>
              </div>
              <button
                type="button"
                className="w-full btn btn-primary"
                onClick={handleRequestTokens}
              >
                ขอเหรียญ
              </button>
            </>
          ) : (
            <p>กรุณาเชื่อมต่อกับ MetaMask</p>
          )}
        </form>

        {/* Right Container for Remaining Time */}
        <div className="w-full max-w-xs p-4 bg-white rounded shadow-md ml-5 text-center">
          <h2 className="text-lg font-semibold text-gray-800 ">
            <strong>เวลาที่เหลือ</strong>
          </h2>
          <p className="text-sm text-gray-600">
            {remainingTime > 0 ? (
              formatRemainingTime(remainingTime)
            ) : (
              <span className="text-green-500">สามารถขอเหรียญได้แล้ว!</span>
            )}
          </p>
        </div>
      </div>

      {/* Message when not connected to MetaMask */}
      {!isConnected && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-md text-center">
            <p className="text-lg font-semibold">กรุณาเชื่อมต่อกับ MetaMask</p>
            <button
              className="mt-4 btn btn-primary"
              onClick={connectToMetaMask}
            >
              เชื่อมต่อ MetaMask
            </button>
          </div>
        </div>
      )}

      <footer className="footer bg-gray-200 text-zinc-950-content p-10 shadow-xl">
        <aside>
          <svg
            width="50"
            height="50"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            fillRule="evenodd"
            clipRule="evenodd"
            className="fill-current"
          >
            <path d="M22.672 15.226l-2.432.811.841 2.515c.33 1.019-.209 2.127-1.23 2.456-1.15.325-2.148-.321-2.463-1.226l-.84-2.518-5.013 1.677.84 2.517c.391 1.203-.434 2.542-1.831 2.542-.88 0-1.601-.564-1.86-1.314l-.842-2.516-2.431.809c-1.135.328-2.145-.317-2.463-1.229-.329-1.018.211-2.127 1.231-2.456l2.432-.809-1.621-4.823-2.432.808c-1.355.384-2.558-.59-2.558-1.839 0-.817.509-1.582 1.327-1.846l2.433-.809-.842-2.515c-.33-1.02.211-2.129 1.232-2.458 1.02-.329 2.13.209 2.461 1.229l.842 2.515 5.011-1.677-.839-2.517c-.403-1.238.484-2.553 1.843-2.553.819 0 1.585.509 1.85 1.326l.841 2.517 2.431-.81c1.02-.33 2.131.211 2.461 1.229.332 1.018-.21 2.126-1.23 2.456l-2.433.809 1.622 4.823 2.433-.809c1.242-.401 2.557.484 2.557 1.838 0 .819-.51 1.583-1.328 1.847m-8.992-6.428l-5.01 1.675 1.619 4.828 5.011-1.674-1.62-4.829z"></path>
          </svg>
          <p>
            NPRU Software Engineering
            <br />
            Block Chain - Final Project
          </p>
        </aside>
        <nav>
          <h6 className="footer-title">Dev Contract</h6>
          <div className="grid grid-flow-col gap-4">
            <a href="https://www.instagram.com/pla_shon/">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                className="fill-current"
              >
                <path
                  d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.97.24 2.432.512a4.92 4.92 0 0 1 1.675 1.675c.272.462.458 1.262.512 2.432.058 1.267.069 1.647.069 4.85s-.012 3.584-.07 4.85c-.054 1.17-.24 1.97-.512 2.432a4.92 4.92 0 0 1-1.675 1.675c-.462.272-1.262.458-2.432.512-1.267.058-1.647.069-4.85.069s-3.584-.012-4.85-.07c-1.17-.054-1.97-.24-2.432-.512a4.92 4.92 0 0 1-1.675-1.675c-.272-.462-.458-1.262-.512-2.432-.058-1.267-.069-1.647-.069-4.85s.012-3.584.07-4.85c.054-1.17.24-1.97.512-2.432A4.92 4.92 0 0 1 4.718 2.745c.462-.272 1.262-.458 2.432-.512C8.416 2.175 8.796 2.163 12 2.163M12 0C8.741 0 8.332.012 7.053.07 5.775.127 4.732.37 3.927.751a7.451 7.451 0 0 0-2.676 2.676C.87 4.617.627 5.66.57 6.939.512 8.218.5 8.627.5 12s.012 3.784.07 5.061c.057 1.278.3 2.321.751 3.126a7.451 7.451 0 0 0 2.676 2.676c.805.451 1.848.694 3.126.751 1.279.057 1.688.07 5.061.07s3.784-.012 5.061-.07c1.278-.057 2.321-.3 3.126-.751a7.451 7.451 0 0 0 2.676-2.676c.451-.805.694-1.848.751-3.126.057-1.278.07-1.687.07-5.061s-.012-3.784-.07-5.061c-.057-1.278-.3-2.321-.751-3.126a7.451 7.451 0 0 0-2.676-2.676C19.268.87 18.225.627 16.947.57 15.668.512 15.259.5 12 .5z"
                  fill="#000"
                />
                <circle cx="12" cy="12" r="3.2" fill="#000" />
                <circle cx="18.406" cy="5.594" r="1.44" fill="#000" />{" "}
              </svg>
            </a>
            <a href="https://www.facebook.com/poobate.nimnuan?locale=th_TH">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                className="fill-current"
              >
                <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"></path>
              </svg>
            </a> 
          </div>
        </nav>
      </footer>
    </div>
  );
}

export default App;
