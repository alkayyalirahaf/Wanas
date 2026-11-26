<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class VerificationDocument extends Model
{
    protected $table = 'verification_documents';
    protected $guarded = ['id'];
   
    public function user()
    {
        return $this->belongsTo(User::class, 'userId');
    }
}
