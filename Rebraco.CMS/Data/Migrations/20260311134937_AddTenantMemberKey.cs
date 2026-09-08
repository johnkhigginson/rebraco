using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Rebraco.CMS.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTenantMemberKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "MemberKey",
                schema: "rebraco",
                table: "Tenants",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Tenants_MemberKey",
                schema: "rebraco",
                table: "Tenants",
                column: "MemberKey",
                filter: "[MemberKey] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Tenants_MemberKey",
                schema: "rebraco",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "MemberKey",
                schema: "rebraco",
                table: "Tenants");
        }
    }
}
