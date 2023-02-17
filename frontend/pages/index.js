import Head from 'next/head'
import styles from '@/styles/Home.module.css'
import Dashboard from '@/components/Dashboard/Dashboard'

export default function Home() {
  return (
    <>
      <Head>
        <title>Snowfall Dashboard</title>
        <meta name="description" content="Homepage of Snowfall DApp" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Dashboard />
    </>
  )
}
