import { Address, HostSubnets, MinMaxHost, Network, NetworkBroadcast, NetworkClass } from "./types"
import { convertBinary, convertDecimal } from "./conversions"

const networkClasses: NetworkClass[] = [
    { name: "A", start: 0, end: 126, maskShort: 8, maskLong: "255.0.0.0" },
    { name: "B", start: 128, end: 191, maskShort: 16, maskLong: "255.255.0.0" },
    { name: "C", start: 192, end: 223, maskShort: 24, maskLong: "255.255.255.0" },
    { name: "D", start: 224, end: 239 },
    { name: "E", start: 240, end: 254 },
    { name: "LOCAL", start: 127, end: 127, maskShort: 8, maskLong: "255.0.0.0" },
]

function getNetworkClass(ipFirst: number, maskGiven: Boolean = false): NetworkClass | null {
    for (let i = 0; i < networkClasses.length; i++) {
        let nClass: NetworkClass = networkClasses[i]

        if (ipFirst < nClass.start || ipFirst > nClass.end) continue
        if (!maskGiven && !nClass.maskShort) return null

        return nClass
    }

    return null
}

function getAddr(ipBin: string[], maskBin: string[]): NetworkBroadcast {
    let networkAddr: string[] = []
    let broadcastAddr: string[] = []

    for (let i = 0; i < ipBin.length; i++) {
        let networkCurrent = ""
        let broadcastCurrent = ""

        for (let j = 0; j < ipBin[i].length; j++) {
            networkCurrent += parseInt(maskBin[i][j]) === 1 ? ipBin[i][j] : "0"
            broadcastCurrent += parseInt(maskBin[i][j]) === 1 ? ipBin[i][j] : "1"
        }

        networkAddr.push(networkCurrent)
        broadcastAddr.push(broadcastCurrent)
    }

    return {
        network: { dec: convertDecimal(networkAddr), bin: networkAddr },
        broadcast: { dec: convertDecimal(broadcastAddr), bin: broadcastAddr },
    }
}

function getMinMax(networkDec: string[], broadcastDec: string[]): MinMaxHost {
    var minHost = [...networkDec]
    var maxHost = [...broadcastDec]

    minHost.push(String(parseInt(minHost.pop()!) + 1))
    maxHost.push(String(parseInt(maxHost.pop()!) - 1))

    return {
        minHost: { dec: minHost, bin: convertBinary(minHost) },
        maxHost: { dec: maxHost, bin: convertBinary(maxHost) },
    }
}

function getHostSubnets(maskBin: string[], nClass: NetworkClass | null): HostSubnets {
    let subnets = 2 ** ((maskBin.join("").match(/1/g) || []).length - (nClass?.maskShort ? nClass.maskShort : 0))
    let subnetHosts = 2 ** (maskBin.join("").match(/0/g) || []).length - 2

    return {
        subnets: subnets,
        subnetHosts: subnetHosts,
        totalHosts: subnets * subnetHosts
    }
}

export function main(ipDec: string[], maskDec: string[]): Network {
    const ip: Address = { dec: ipDec, bin: convertBinary(ipDec, 8) }
    const mask: Address = { dec: maskDec, bin: convertBinary(maskDec, 8) }

    const nClass: NetworkClass | null = getNetworkClass(parseInt(ip.dec[0]), Boolean(maskDec))
    const addr = getAddr(ip.bin, mask.bin)

    console.log(addr)

    const hostMinMax = getMinMax(addr.network.dec, addr.broadcast.dec)
    const hostSubnets = getHostSubnets(mask.bin, nClass)

    return {
        ip: ip,
        mask: mask,
        networkClass: nClass,
        ...addr,
        ...hostMinMax,
        ...hostSubnets
    }
}
