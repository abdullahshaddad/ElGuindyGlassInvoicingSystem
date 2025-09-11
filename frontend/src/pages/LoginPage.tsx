export default function LoginPage() {
    return (
        <div className="min-h-screen bg-bg-primary flex items-center justify-center">
            <div className="max-w-md w-full space-y-8 p-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-primary font-cairo mb-2">
                        مجموعة الجندي للزجاج
                    </h1>
                    <p className="text-text-secondary">تسجيل الدخول إلى نظام إدارة الفواتير</p>
                </div>

                <form className="space-y-6">
                    <div>
                        <label className="form-label">اسم المستخدم</label>
                        <input type="text" className="form-input" placeholder="أدخل اسم المستخدم" />
                    </div>

                    <div>
                        <label className="form-label">كلمة المرور</label>
                        <input type="password" className="form-input" placeholder="أدخل كلمة المرور" />
                    </div>

                    <button type="submit" className="btn-primary w-full">
                        تسجيل الدخول
                    </button>
                </form>
            </div>
        </div>
    )
}