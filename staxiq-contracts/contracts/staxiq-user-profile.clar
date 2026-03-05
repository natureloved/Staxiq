;; Staxiq User Profile Contract
;; Stores user risk profiles and AI strategy history on-chain
;; Built on Stacks Bitcoin L2

;; ============================================================
;; CONSTANTS
;; ============================================================

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-FOUND (err u404))
(define-constant ERR-INVALID-RISK (err u400))
(define-constant ERR-UNAUTHORIZED (err u401))

;; Valid risk profiles
(define-constant RISK-CONSERVATIVE u1)
(define-constant RISK-BALANCED u2)
(define-constant RISK-AGGRESSIVE u3)

;; ============================================================
;; DATA STORAGE
;; ============================================================

;; Store user risk profile
;; Maps wallet address to risk level (1=conservative, 2=balanced, 3=aggressive)
(define-map user-profiles
  principal
  {
    risk-level: uint,
    created-at: uint,
    updated-at: uint,
    strategy-count: uint
  }
)

;; Store AI strategy history
;; Maps (user, strategy-id) to strategy record
(define-map strategy-history
  { user: principal, strategy-id: uint }
  {
    risk-level: uint,
    strategy-hash: (string-ascii 64),
    protocol: (string-ascii 32),
    timestamp: uint
  }
)

;; Track total strategies per user
(define-map user-strategy-count
  principal
  uint
)

;; ============================================================
;; PRIVATE FUNCTIONS
;; ============================================================

(define-private (is-valid-risk-level (level uint))
  (or
    (is-eq level RISK-CONSERVATIVE)
    (is-eq level RISK-BALANCED)
    (is-eq level RISK-AGGRESSIVE)
  )
)

;; ============================================================
;; PUBLIC FUNCTIONS
;; ============================================================

;; Save or update user risk profile on-chain
(define-public (set-risk-profile (risk-level uint))
  (begin
    ;; Validate risk level
    (asserts! (is-valid-risk-level risk-level) ERR-INVALID-RISK)

    ;; Check if profile exists to set created-at correctly
    (let (
      (existing (map-get? user-profiles tx-sender))
      (created (if (is-some existing)
        (get created-at (unwrap-panic existing))
        burn-block-height
      ))
    )
      ;; Save profile
      (map-set user-profiles tx-sender {
        risk-level: risk-level,
        created-at: created,
        updated-at: burn-block-height,
        strategy-count: (if (is-some existing)
          (get strategy-count (unwrap-panic existing))
          u0
        )
      })
      (ok risk-level)
    )
  )
)

;; Anchor AI strategy recommendation on-chain
(define-public (save-strategy
  (strategy-hash (string-ascii 64))
  (protocol (string-ascii 32))
)
  (let (
    (profile (map-get? user-profiles tx-sender))
    (current-count (default-to u0 (map-get? user-strategy-count tx-sender)))
    (new-count (+ current-count u1))
  )
    ;; User must have a profile first
    (asserts! (is-some profile) ERR-NOT-FOUND)

    ;; Save strategy to history
    (map-set strategy-history
      { user: tx-sender, strategy-id: new-count }
      {
        risk-level: (get risk-level (unwrap-panic profile)),
        strategy-hash: strategy-hash,
        protocol: protocol,
        timestamp: burn-block-height
      }
    )

    ;; Update strategy count
    (map-set user-strategy-count tx-sender new-count)

    ;; Update profile strategy count
    (map-set user-profiles tx-sender
      (merge (unwrap-panic profile) {
        strategy-count: new-count,
        updated-at: burn-block-height
      })
    )

    (ok new-count)
  )
)

;; ============================================================
;; READ-ONLY FUNCTIONS
;; ============================================================

;; Get user risk profile
(define-read-only (get-user-profile (user principal))
  (match (map-get? user-profiles user)
    profile (ok profile)
    ERR-NOT-FOUND
  )
)

;; Get specific strategy from history
(define-read-only (get-strategy
  (user principal)
  (strategy-id uint)
)
  (match (map-get? strategy-history { user: user, strategy-id: strategy-id })
    strategy (ok strategy)
    ERR-NOT-FOUND
  )
)

;; Get total strategy count for user
(define-read-only (get-strategy-count (user principal))
  (ok (default-to u0 (map-get? user-strategy-count user)))
)

;; Check if user has a saved profile
(define-read-only (has-profile (user principal))
  (is-some (map-get? user-profiles user))
)

;; Get risk level as string for display
(define-read-only (get-risk-label (user principal))
  (match (map-get? user-profiles user)
    profile (ok
      (if (is-eq (get risk-level profile) RISK-CONSERVATIVE)
        "Conservative"
        (if (is-eq (get risk-level profile) RISK-BALANCED)
          "Balanced"
          "Aggressive"
        )
      )
    )
    ERR-NOT-FOUND
  )
)
