import { createContext, useContext, useEffect, useState } from 'react'

const CartContext = createContext(null)

const CART_STORAGE_KEY = 'marketplace_cart'
const WISHLIST_STORAGE_KEY = 'marketplace_wishlist'

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isWishlistOpen, setIsWishlistOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
    } catch {
      // ignore local storage errors
    }
  }, [cart])

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist))
    } catch {
      // ignore local storage errors
    }
  }, [wishlist])

  function addToCart(product, quantity = 1) {
    const prodId = product?.id || product?._id
    if (!product || !prodId) return
    const maxStock = product.stock ?? 999
    if (maxStock <= 0) return

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => (item.product?.id || item.product?._id) === prodId)
      if (existingIndex > -1) {
        const currentQty = prevCart[existingIndex].quantity
        const newQty = Math.min(currentQty + quantity, maxStock)
        const updated = [...prevCart]
        updated[existingIndex] = { ...updated[existingIndex], quantity: newQty }
        return updated
      }
      return [...prevCart, { product, quantity: Math.min(quantity, maxStock) }]
    })
    setIsCartOpen(true)
  }

  function removeFromCart(productId) {
    setCart((prevCart) => prevCart.filter((item) => (item.product?.id || item.product?._id) !== productId))
  }

  function updateQuantity(productId, quantity) {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCart((prevCart) =>
      prevCart.map((item) => {
        if ((item.product?.id || item.product?._id) === productId) {
          const maxStock = item.product.stock ?? 999
          return { ...item, quantity: Math.min(quantity, maxStock) }
        }
        return item
      })
    )
  }

  function clearCart() {
    setCart([])
  }

  function toggleWishlist(product) {
    if (!product || !product.id) return
    setWishlist((prevWishlist) => {
      const exists = prevWishlist.some((item) => item.id === product.id)
      if (exists) {
        return prevWishlist.filter((item) => item.id !== product.id)
      }
      return [...prevWishlist, product]
    })
  }

  function isInWishlist(productId) {
    return wishlist.some((item) => item.id === productId)
  }

  function removeFromWishlist(productId) {
    setWishlist((prevWishlist) => prevWishlist.filter((item) => item.id !== productId))
  }

  function clearWishlist() {
    setWishlist([])
  }

  function moveToCart(product) {
    if (!product || !product.id) return
    addToCart(product, 1)
    removeFromWishlist(product.id)
  }

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)
  const cartSubtotal = cart.reduce((total, item) => {
    const unitPrice = item.product.salePrice !== null && item.product.salePrice !== undefined
      ? item.product.salePrice
      : item.product.price
    return total + unitPrice * item.quantity
  }, 0)
  const wishlistCount = wishlist.length

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartSubtotal,
        isCartOpen,
        setIsCartOpen,
        wishlist,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist,
        moveToCart,
        isInWishlist,
        wishlistCount,
        isWishlistOpen,
        setIsWishlistOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
