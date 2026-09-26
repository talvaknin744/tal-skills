def dispatch(db, mailer):
    for notification in db.query("SELECT * FROM notifications WHERE sent_at IS NULL"):
        mailer.send(notification.recipient, notification.body)
        db.execute(
            "UPDATE notifications SET sent_at = CURRENT_TIMESTAMP WHERE id = ?",
            (notification.id,),
        )
